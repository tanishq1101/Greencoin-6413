import { Link } from "wouter";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Gift, Trophy, ArrowRight, Recycle, Clock, Sparkles } from "lucide-react";
import { authClient } from "../lib/auth";
import { api } from "../lib/api";
import { useBalance } from "../components/app-shell";
import { CoinIcon, CountUp, StatusPill, Spinner } from "../components/ui-bits";
import { CONTAINER_LABELS, timeAgo, fmt } from "../lib/constants";

export default function Home() {
  const { data: session } = authClient.useSession();
  const { data: summary, isLoading } = useBalance();
  const returns = useQuery({
    queryKey: ["my-returns"],
    queryFn: async () => {
      const res = await api.returns.me.$get();
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });
  const lb = useQuery({
    queryKey: ["leaderboard", "all"],
    queryFn: async () => {
      const res = await api.leaderboard.$get({ query: { period: "all" } });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const myRank = lb.data?.myRank?.rank;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-charcoal/60">Hi {firstName},</p>
        <h1 className="font-display text-3xl font-semibold text-forest">Let’s keep it green.</h1>
      </motion.div>

      {/* Balance card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}
        className="relative overflow-hidden rounded-3xl bg-forest text-cream p-6 md:p-7">
        <div className="absolute -right-8 -top-10 size-40 rounded-full bg-moss/30 blur-2xl" />
        <div className="relative">
          <div className="text-cream/60 text-sm">GreenCoin balance</div>
          <div className="flex items-center gap-3 mt-1">
            <span className="inline-grid place-items-center rounded-full coin-gradient text-forest font-bold size-9 text-lg">G</span>
            <CountUp value={summary?.balance ?? 0} className="font-display text-5xl font-semibold" />
          </div>
          <div className="flex gap-6 mt-5 text-sm">
            <div><span className="text-cream/55">Approved returns</span><div className="font-semibold text-lg tabular">{summary?.approved ?? 0}</div></div>
            <div><span className="text-cream/55">Containers saved</span><div className="font-semibold text-lg tabular">{summary?.totalQty ?? 0}</div></div>
            <div><span className="text-cream/55">Colony rank</span><div className="font-semibold text-lg tabular">{myRank ? `#${myRank}` : "—"}</div></div>
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: "/app/log", icon: PlusCircle, label: "Log return", accent: true },
          { to: "/app/redeem", icon: Gift, label: "Redeem" },
          { to: "/app/leaderboard", icon: Trophy, label: "Leaderboard" },
        ].map((a) => (
          <Link key={a.to} to={a.to}
            className={`rounded-2xl border p-4 flex flex-col gap-3 transition ${a.accent ? "bg-forest text-cream border-forest" : "bg-paper border-border hover:border-moss/40"}`}>
            <a.icon size={22} className={a.accent ? "text-gold-light" : "text-moss"} />
            <span className="text-sm font-semibold">{a.label}</span>
          </Link>
        ))}
      </div>

      {summary && summary.pending > 0 && (
        <div className="rounded-2xl bg-gold/10 border border-gold/30 p-4 flex items-center gap-3 text-sm">
          <Clock size={18} className="text-[#8a6a1f]" />
          <span><b>{summary.pending}</b> return{summary.pending > 1 ? "s" : ""} awaiting admin approval — coins land once approved.</span>
        </div>
      )}

      {/* Recent activity */}
      <section className="bg-paper rounded-3xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-forest">Recent returns</h2>
          <Link to="/app/wallet" className="text-sm font-medium text-moss flex items-center gap-1">View all <ArrowRight size={15} /></Link>
        </div>
        {returns.isLoading || isLoading ? (
          <div className="py-8 grid place-items-center"><Spinner /></div>
        ) : returns.data && returns.data.returns.length ? (
          <ul className="divide-y divide-border">
            {returns.data.returns.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <span className="size-10 grid place-items-center rounded-xl bg-cream text-moss"><Recycle size={18} /></span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{r.quantity}× {CONTAINER_LABELS[r.containerType] ?? r.containerType}{r.brand ? ` · ${r.brand}` : ""}</div>
                  <div className="text-xs text-charcoal/50">{timeAgo(r.createdAt as unknown as string)}</div>
                </div>
                {r.status === "approved" || r.status === "adjusted" ? (
                  <span className="flex items-center gap-1 font-semibold text-moss text-sm"><CoinIcon size={15} /> +{fmt(r.coinsAwarded)}</span>
                ) : (
                  <StatusPill status={r.status} />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-charcoal/55 mb-3">No returns yet — your first one is worth coins.</p>
            <Link to="/app/log" className="inline-flex items-center gap-2 bg-forest text-cream font-semibold rounded-full px-5 py-2.5 text-sm">Log a return</Link>
          </div>
        )}
      </section>

      <Link to="/app/helper" className="flex items-center gap-3 rounded-2xl bg-moss/10 border border-moss/20 p-4 hover:bg-moss/15 transition">
        <span className="size-10 grid place-items-center rounded-xl bg-moss text-cream"><Sparkles size={19} /></span>
        <div className="flex-1">
          <div className="font-semibold text-forest">Ask GreenBot</div>
          <div className="text-sm text-charcoal/60">Not sure how to log something? Get instant help.</div>
        </div>
        <ArrowRight size={18} className="text-moss" />
      </Link>
    </div>
  );
}
