import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Wand2, Check } from "lucide-react";
import { api } from "../lib/api";
import { CONTAINERS, coinsForReturn } from "../lib/constants";
import { CoinIcon, Spinner, celebrate } from "../components/ui-bits";

export default function LogReturn() {
  const [, nav] = useLocation();
  const qc = useQueryClient();
  const [type, setType] = useState("plastic_bottle");
  const [qty, setQty] = useState(1);
  const [brand, setBrand] = useState("");
  const [note, setNote] = useState("");
  const [aiText, setAiText] = useState("");
  const [aiResult, setAiResult] = useState<{ containerType: string; confidence: number; reasoning: string } | null>(null);
  const [done, setDone] = useState(false);

  const categorize = useMutation({
    mutationFn: async () => {
      const res = await api.ai.categorize.$post({ json: { text: aiText } });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: (r) => {
      setAiResult(r);
      if (r.confidence >= 0.5) setType(r.containerType);
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const res = await api.returns.$post({ json: { containerType: type, quantity: qty, brand: brand || undefined, note: note || undefined } });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: () => {
      celebrate();
      setDone(true);
      qc.invalidateQueries({ queryKey: ["my-returns"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      setTimeout(() => nav("/app"), 1600);
    },
  });

  const estimate = coinsForReturn(type, qty);

  if (done) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="size-20 mx-auto grid place-items-center rounded-full bg-moss text-cream mb-4"><Check size={40} /></div>
          <h1 className="font-display text-3xl font-semibold text-forest">Return logged!</h1>
          <p className="text-charcoal/60 mt-2 flex items-center justify-center gap-1.5">
            <CoinIcon size={18} /> <b>+{estimate}</b> pending admin approval
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="font-display text-3xl font-semibold text-forest">Log a return</h1>
        <p className="text-charcoal/60 mt-1">Three taps. Coins land after approval.</p>
      </div>

      {/* AI categorize */}
      <div className="rounded-2xl bg-moss/8 border border-moss/20 p-4">
        <label htmlFor="ai-description" className="text-sm font-medium text-forest flex items-center gap-2 mb-2"><Wand2 size={16} /> Not sure of the type? Describe it</label>
        <div className="flex gap-2">
          <input id="ai-description" value={aiText} onChange={(e) => setAiText(e.target.value)} placeholder="e.g. empty 1L Bisleri water bottle"
            className="flex-1 border border-border bg-card rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-moss" />
          <button onClick={() => aiText && categorize.mutate()} disabled={categorize.isPending || !aiText}
            className="bg-moss text-cream rounded-xl px-4 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50">
            {categorize.isPending ? <Spinner className="border-cream/40 border-t-cream size-4" /> : "Detect"}
          </button>
        </div>
        {aiResult && (
          <p className="text-xs text-charcoal/65 mt-2">
            GreenBot suggests <b className="text-forest">{CONTAINERS.find((c) => c.value === aiResult.containerType)?.label}</b> ({Math.round(aiResult.confidence * 100)}% sure). {aiResult.reasoning}
          </p>
        )}
      </div>

      {/* Container type */}
      <div>
        <div className="text-sm font-medium text-charcoal/75 mb-2">Container type</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CONTAINERS.map((c) => (
            <button key={c.value} onClick={() => setType(c.value)}
              className={`rounded-2xl border p-3.5 text-left transition ${type === c.value ? "border-forest bg-forest/5 ring-1 ring-forest" : "border-border bg-paper hover:border-moss/40"}`}>
              <div className="text-2xl mb-1.5">{c.emoji}</div>
              <div className="text-sm font-semibold text-forest leading-tight">{c.label}</div>
              <div className="text-xs text-charcoal/55 flex items-center gap-1 mt-1"><CoinIcon size={12} /> {c.coins}/unit</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div>
        <div className="text-sm font-medium text-charcoal/75 mb-2">Quantity</div>
        <div className="flex items-center gap-4">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="size-12 rounded-xl border border-border bg-paper grid place-items-center active:scale-95"><Minus size={20} /></button>
          <span className="font-display text-3xl font-semibold tabular w-12 text-center">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(99, q + 1))} className="size-12 rounded-xl border border-border bg-paper grid place-items-center active:scale-95"><Plus size={20} /></button>
        </div>
      </div>

      {/* Brand + note */}
      <div className="grid sm:grid-cols-2 gap-4">
        <label htmlFor="return-brand" className="block">
          <span className="text-sm font-medium text-charcoal/75 mb-1.5 block">Brand (optional)</span>
          <input id="return-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Bisleri, Amul…"
            className="w-full border border-border bg-card rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-moss" />
        </label>
        <label htmlFor="return-note" className="block">
          <span className="text-sm font-medium text-charcoal/75 mb-1.5 block">Note (optional)</span>
          <input id="return-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where from…"
            className="w-full border border-border bg-card rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-moss" />
        </label>
      </div>

      {/* Submit */}
      <div className="sticky bottom-20 md:bottom-4 bg-cream/80 backdrop-blur pt-2">
        <button onClick={() => submit.mutate()} disabled={submit.isPending}
          className="w-full bg-forest text-cream rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 hover:bg-emerald transition disabled:opacity-60">
          {submit.isPending ? <Spinner className="border-cream/40 border-t-cream" /> : <>Log return · <CoinIcon size={16} /> +{estimate}</>}
        </button>
      </div>
    </div>
  );
}
