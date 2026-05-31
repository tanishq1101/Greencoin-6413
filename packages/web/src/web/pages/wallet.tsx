import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Recycle } from "lucide-react";
import { api } from "../lib/api";
import { useBalance } from "../components/app-shell";
import { CoinIcon, CountUp, StatusPill, Spinner } from "../components/ui-bits";
import { CONTAINER_LABELS, timeAgo, fmt } from "../lib/constants";

export default function Wallet() {
  const [tab, setTab] = useState<"ledger" | "returns" | "redemptions">("ledger");
  const { data: summary } = useBalance();
  const ledger = useQuery({ queryKey: ["ledger"], queryFn: async () => { const res = await api.returns.me.ledger.$get(); if (!res.ok) throw new Error("failed"); return res.json(); } });
  const returns = useQuery({ queryKey: ["my-returns"], queryFn: async () => { const res = await api.returns.me.$get(); if (!res.ok) throw new Error("failed"); return res.json(); } });
  const reds = useQuery({ queryKey: ["redemptions"], queryFn: async () => { const res = await api.rewards.me.redemptions.$get(); if (!res.ok) throw new Error("failed"); return res.json(); } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-forest">Wallet</h1>

      <div className="rounded-3xl bg-forest text-cream p-6">
        <div className="text-cream/60 text-sm">Available balance</div>
        <div className="flex items-center gap-3 mt-1">
          <span className="inline-grid place-items-center rounded-full coin-gradient text-forest font-bold size-9 text-lg">G</span>
          <CountUp value={summary?.balance ?? 0} className="font-display text-5xl font-semibold" />
        </div>
      </div>

      <div className="flex gap-1 bg-muted rounded-full p-1 w-fit">
        {(["ledger", "returns", "redemptions"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition ${tab === t ? "bg-forest text-cream" : "text-charcoal/60"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-paper rounded-3xl border border-border p-2 sm:p-3">
        {tab === "ledger" && (
          ledger.isLoading ? <Loader /> : ledger.data?.ledger.length ? (
            <ul className="divide-y divide-border">
              {ledger.data.ledger.map((l) => {
                const pos = l.coinsDelta > 0;
                return (
                  <li key={l.id} className="flex items-center gap-3 px-2 py-3">
                    <span className={`size-9 grid place-items-center rounded-xl ${pos ? "bg-moss/15 text-moss" : "bg-gold/15 text-[#8a6a1f]"}`}>
                      {pos ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{l.description}</div>
                      <div className="text-xs text-charcoal/50">{timeAgo(l.createdAt as unknown as string)} · bal {fmt(l.balanceAfter)}</div>
                    </div>
                    <span className={`font-semibold text-sm tabular ${pos ? "text-moss" : "text-[#8a6a1f]"}`}>{pos ? "+" : ""}{fmt(l.coinsDelta)}</span>
                  </li>
                );
              })}
            </ul>
          ) : <Empty text="No transactions yet." />
        )}

        {tab === "returns" && (
          returns.isLoading ? <Loader /> : returns.data?.returns.length ? (
            <ul className="divide-y divide-border">
              {returns.data.returns.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-2 py-3">
                  <span className="size-9 grid place-items-center rounded-xl bg-cream text-moss"><Recycle size={17} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.quantity}× {CONTAINER_LABELS[r.containerType] ?? r.containerType}</div>
                    <div className="text-xs text-charcoal/50">{timeAgo(r.createdAt as unknown as string)}{r.brand ? ` · ${r.brand}` : ""}</div>
                  </div>
                  {r.status === "approved" || r.status === "adjusted"
                    ? <span className="flex items-center gap-1 font-semibold text-moss text-sm"><CoinIcon size={14} />+{fmt(r.coinsAwarded)}</span>
                    : <StatusPill status={r.status} />}
                </li>
              ))}
            </ul>
          ) : <Empty text="No returns logged yet." />
        )}

        {tab === "redemptions" && (
          reds.isLoading ? <Loader /> : reds.data?.redemptions.length ? (
            <ul className="divide-y divide-border">
              {reds.data.redemptions.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-2 py-3">
                  <span className="size-9 grid place-items-center rounded-xl bg-gold/15 text-[#8a6a1f]"><ArrowUpRight size={17} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.rewardTitle}</div>
                    <div className="text-xs text-charcoal/50">{timeAgo(r.createdAt as unknown as string)} · code {r.code}</div>
                  </div>
                  <span className="font-semibold text-sm text-[#8a6a1f] tabular">-{fmt(r.coinsSpent)}</span>
                </li>
              ))}
            </ul>
          ) : <Empty text="No redemptions yet. Treat yourself!" />
        )}
      </div>
    </div>
  );
}

const Loader = () => <div className="py-10 grid place-items-center"><Spinner /></div>;
const Empty = ({ text }: { text: string }) => <div className="py-10 text-center text-charcoal/55 text-sm">{text}</div>;
