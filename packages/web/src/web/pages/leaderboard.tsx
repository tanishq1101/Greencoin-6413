import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Crown, TrendingUp } from "lucide-react";
import { authClient } from "../lib/auth";
import { api } from "../lib/api";
import { CoinIcon, Spinner } from "../components/ui-bits";
import { fmt } from "../lib/constants";

const PERIODS = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

export default function Leaderboard() {
  const [period, setPeriod] = useState("week");
  const { data: session } = authClient.useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: async () => (await api.leaderboard.$get({ query: { period } })).json(),
  });

  const me = session?.user?.id;
  const top3 = data?.leaderboard.slice(0, 3) ?? [];
  const rest = data?.leaderboard.slice(3) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-forest">Leaderboard</h1>
        <p className="text-charcoal/60 mt-1">See how your family stacks up across the colony.</p>
      </div>

      <div className="flex gap-1 bg-muted rounded-full p-1 w-fit">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${period === p.key ? "bg-forest text-cream" : "text-charcoal/60"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 grid place-items-center"><Spinner /></div>
      ) : (
        <>
          {/* My rank banner */}
          {data?.myRank && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-moss/10 border border-moss/25 p-4 flex items-center gap-4">
              <div className="size-12 grid place-items-center rounded-full bg-forest text-cream font-display font-semibold">#{data.myRank.rank}</div>
              <div className="flex-1">
                <div className="font-semibold text-forest">You — {data.myRank.familyName ?? data.myRank.name} family</div>
                <div className="text-sm text-charcoal/60 flex items-center gap-1.5"><CoinIcon size={13} /> {fmt(data.myRank.score)} earned</div>
              </div>
              {data.deltaToNext > 0 && (
                <div className="text-right text-sm">
                  <div className="text-charcoal/50 flex items-center gap-1 justify-end"><TrendingUp size={14} /> to next</div>
                  <div className="font-semibold text-forest tabular">{fmt(data.deltaToNext)}</div>
                </div>
              )}
            </motion.div>
          )}

          {/* Podium */}
          {top3.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 items-end">
              {[top3[1], top3[0], top3[2]].map((u, i) => {
                const place = i === 1 ? 1 : i === 0 ? 2 : 3;
                const h = place === 1 ? "h-32" : "h-24";
                return (
                  <motion.div key={u!.userId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="flex flex-col items-center">
                    {place === 1 && <Crown className="text-gold mb-1" size={22} />}
                    <div className={`size-12 rounded-full grid place-items-center font-display font-semibold mb-2 ${place === 1 ? "bg-gold text-forest" : "bg-forest text-cream"}`}>
                      {(u!.familyName ?? u!.name ?? "?")[0]}
                    </div>
                    <div className="text-xs font-semibold text-forest text-center truncate w-full">{u!.familyName ?? u!.name}</div>
                    <div className="text-xs text-charcoal/55 flex items-center gap-1"><CoinIcon size={11} />{fmt(u!.score)}</div>
                    <div className={`${h} w-full rounded-t-xl mt-2 ${place === 1 ? "coin-gradient" : "bg-forest/15"} grid place-items-end justify-center pb-1`}>
                      <span className="font-display font-bold text-forest">{place}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Rest */}
          <ul className="bg-paper rounded-3xl border border-border divide-y divide-border">
            {rest.map((u) => (
              <li key={u.userId} className={`flex items-center gap-3 px-4 py-3 ${u.userId === me ? "bg-moss/5" : ""}`}>
                <span className="w-7 text-center font-display font-semibold text-charcoal/50">{u.rank}</span>
                <div className="size-9 rounded-full bg-forest/10 grid place-items-center font-semibold text-forest text-sm">{(u.familyName ?? u.name ?? "?")[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate text-forest">{u.familyName ?? u.name} {u.userId === me && <span className="text-moss text-xs">· you</span>}</div>
                  <div className="text-xs text-charcoal/50 truncate">{u.colonyName}{u.flatNumber ? ` · ${u.flatNumber}` : ""} · {u.returns} returns</div>
                </div>
                <span className="flex items-center gap-1 font-semibold text-sm tabular text-forest"><CoinIcon size={13} />{fmt(u.score)}</span>
              </li>
            ))}
            {!top3.length && <li className="px-4 py-10 text-center text-charcoal/55 text-sm">No activity in this period yet.</li>}
          </ul>
        </>
      )}
    </div>
  );
}
