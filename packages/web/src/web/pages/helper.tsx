import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Send } from "lucide-react";
import { api } from "../lib/api";
import { Spinner } from "../components/ui-bits";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How do I log a return?",
  "Which category for a milk carton?",
  "What can I redeem with 300 coins?",
  "How does the leaderboard work?",
];

export default function Helper() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I’m GreenBot 🌿 Ask me how to log returns, which container category to pick, or what rewards your coins can unlock." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const send = useMutation({
    mutationFn: async (msgs: Msg[]) => {
      const res = await api.ai.chat.$post({ json: { messages: msgs } });
      return res.json();
    },
    onSuccess: (r) => setMessages((m) => [...m, { role: "assistant", content: (r as { reply: string }).reply }]),
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, send.isPending]);

  const submit = (text: string) => {
    if (!text.trim() || send.isPending) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    send.mutate(next.filter((m) => m.role !== "assistant" || m !== next[0]) as Msg[]);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-9rem)] md:h-[calc(100dvh-6rem)]">
      <div className="flex items-center gap-3 mb-4">
        <span className="size-11 grid place-items-center rounded-2xl bg-moss text-cream"><Sparkles size={22} /></span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest">GreenBot</h1>
          <p className="text-sm text-charcoal/55">Your recycling assistant · powered by Groq</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap ${
              m.role === "user" ? "bg-forest text-cream rounded-br-sm" : "bg-paper border border-border text-charcoal rounded-bl-sm"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {send.isPending && (
          <div className="flex justify-start"><div className="bg-paper border border-border rounded-2xl rounded-bl-sm px-4 py-3"><Spinner className="size-4" /></div></div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 my-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => submit(s)} className="text-sm bg-paper border border-border rounded-full px-3.5 py-2 text-charcoal/70 hover:border-moss/40">{s}</button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); submit(input); }} className="mt-3 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask GreenBot…" aria-label="Ask GreenBot"
          className="flex-1 border border-border bg-card rounded-2xl px-4 py-3 text-sm outline-none focus:border-moss" />
        <button type="submit" disabled={send.isPending || !input.trim()}
          className="size-12 grid place-items-center bg-forest text-cream rounded-2xl disabled:opacity-50"><Send size={18} /></button>
      </form>
    </div>
  );
}
