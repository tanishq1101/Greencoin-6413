import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, Shirt, Check, X, Copy } from "lucide-react";
import { api } from "../lib/api";
import { useBalance } from "../components/app-shell";
import { CoinIcon, Spinner, celebrate } from "../components/ui-bits";
import { fmt } from "../lib/constants";

type Reward = {
  id: number; title: string; description: string; category: string;
  coinCost: number; imageUrl: string; brand: string | null; stock: number;
};

export default function Redeem() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "electronics" | "clothing">("all");
  const [selected, setSelected] = useState<Reward | null>(null);
  const [success, setSuccess] = useState<{ title: string; code: string } | null>(null);
  const { data: summary } = useBalance();
  const balance = summary?.balance ?? 0;

  const { data, isLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => (await api.rewards.$get()).json(),
  });

  const redeem = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.rewards[":id"].redeem.$post({ param: { id: String(id) } });
      if (!res.ok) throw new Error((await res.json() as { message?: string }).message ?? "Failed");
      return res.json();
    },
    onSuccess: (r) => {
      celebrate();
      setSuccess({ title: selected!.title, code: (r as { code: string }).code });
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["rewards"] });
      qc.invalidateQueries({ queryKey: ["redemptions"] });
      qc.invalidateQueries({ queryKey: ["ledger"] });
    },
  });

  const rewards = (data?.rewards ?? []).filter((r) => filter === "all" || r.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-forest">Redeem</h1>
          <p className="text-charcoal/60 mt-1">Turn GreenCoins into real rewards.</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-charcoal/55">Your balance</div>
          <div className="flex items-center gap-1.5 justify-end"><CoinIcon size={18} /><span className="font-display text-2xl font-semibold tabular text-forest">{fmt(balance)}</span></div>
        </div>
      </div>

      <div className="flex gap-1 bg-muted rounded-full p-1 w-fit">
        {([["all", "All"], ["electronics", "Electronics"], ["clothing", "Clothing"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${filter === k ? "bg-forest text-cream" : "text-charcoal/60"}`}>
            {k === "electronics" && <Cpu size={15} />}{k === "clothing" && <Shirt size={15} />}{l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 grid place-items-center"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((r, i) => {
            const afford = balance >= r.coinCost;
            const out = r.stock <= 0;
            return (
              <motion.button key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => !out && setSelected(r)} disabled={out}
                className="group text-left bg-paper rounded-3xl border border-border overflow-hidden hover:border-moss/40 hover:shadow-md transition disabled:opacity-60">
                <div className="aspect-square bg-cream overflow-hidden relative">
                  <img src={r.imageUrl} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold uppercase tracking-wide bg-forest/85 text-cream px-2 py-1 rounded-full">{r.category}</span>
                  {out && <span className="absolute inset-0 grid place-items-center bg-cream/70 font-semibold text-charcoal">Out of stock</span>}
                </div>
                <div className="p-3.5">
                  <div className="font-semibold text-forest text-sm leading-tight line-clamp-2">{r.title}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="flex items-center gap-1 font-semibold tabular text-sm"><CoinIcon size={14} />{fmt(r.coinCost)}</span>
                    <span className={`text-xs font-medium ${afford ? "text-moss" : "text-charcoal/40"}`}>{afford ? "Redeem" : "Keep earning"}</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Confirm modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-end md:place-items-center bg-black/40 p-0 md:p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-paper w-full md:max-w-sm rounded-t-3xl md:rounded-3xl p-5">
              <div className="flex items-start gap-4">
                <img src={selected.imageUrl} alt="" className="size-24 rounded-2xl object-cover bg-cream" />
                <div className="flex-1">
                  <div className="font-display text-lg font-semibold text-forest">{selected.title}</div>
                  <p className="text-sm text-charcoal/60 mt-0.5">{selected.description}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-charcoal/40"><X size={20} /></button>
              </div>
              <div className="flex items-center justify-between mt-5 p-3 rounded-2xl bg-cream">
                <span className="text-sm text-charcoal/60">Cost</span>
                <span className="flex items-center gap-1.5 font-semibold tabular"><CoinIcon size={16} />{fmt(selected.coinCost)}</span>
              </div>
              <div className="flex items-center justify-between mt-2 px-3 text-sm">
                <span className="text-charcoal/60">Balance after</span>
                <span className={`font-semibold tabular ${balance - selected.coinCost >= 0 ? "text-forest" : "text-red-600"}`}>{fmt(balance - selected.coinCost)}</span>
              </div>
              {redeem.isError && <p className="text-sm text-red-600 mt-3 text-center">{(redeem.error as Error).message}</p>}
              <button onClick={() => redeem.mutate(selected.id)} disabled={balance < selected.coinCost || redeem.isPending}
                className="w-full mt-4 bg-forest text-cream rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {redeem.isPending ? <Spinner className="border-cream/40 border-t-cream" /> : balance < selected.coinCost ? "Not enough coins" : "Confirm redemption"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success modal */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setSuccess(null)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="bg-paper w-full max-w-xs rounded-3xl p-6 text-center">
              <div className="size-16 mx-auto grid place-items-center rounded-full bg-moss text-cream mb-3"><Check size={32} /></div>
              <h2 className="font-display text-xl font-semibold text-forest">Redeemed!</h2>
              <p className="text-sm text-charcoal/60 mt-1">{success.title}</p>
              <button onClick={() => navigator.clipboard?.writeText(success.code)}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-cream border border-border rounded-xl py-3 font-mono font-semibold text-forest">
                {success.code} <Copy size={15} />
              </button>
              <p className="text-xs text-charcoal/50 mt-2">Show this code to your colony volunteer to collect.</p>
              <button onClick={() => setSuccess(null)} className="mt-4 text-sm font-medium text-moss">Done</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
