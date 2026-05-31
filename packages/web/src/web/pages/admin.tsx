import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Check, X, Sliders, AlertTriangle, Users, Gift, BarChart3, Recycle } from "lucide-react";
import { api } from "../lib/api";
import { CoinIcon, StatusPill, Spinner } from "../components/ui-bits";
import { CONTAINER_LABELS, coinsForReturn, timeAgo, fmt } from "../lib/constants";

type Tab = "queue" | "flags" | "users" | "rewards" | "reports";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("queue");
  const tabs: { k: Tab; label: string; icon: typeof Check }[] = [
    { k: "queue", label: "Review queue", icon: Recycle },
    { k: "flags", label: "Flags", icon: AlertTriangle },
    { k: "users", label: "Families", icon: Users },
    { k: "rewards", label: "Rewards", icon: Gift },
    { k: "reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="size-11 grid place-items-center rounded-2xl bg-forest text-cream"><ShieldCheck size={22} /></span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest">Admin console</h1>
          <p className="text-sm text-charcoal/55">Manage returns, rewards & your colony.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition ${tab === t.k ? "bg-forest text-cream" : "bg-paper border border-border text-charcoal/60"}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "queue" && <Queue />}
      {tab === "flags" && <Flags />}
      {tab === "users" && <UsersTab />}
      {tab === "rewards" && <RewardsTab />}
      {tab === "reports" && <Reports />}
    </div>
  );
}

function Queue() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-returns", "pending"],
    queryFn: async () => (await api.admin.returns.$get({ query: { status: "pending" } })).json(),
  });
  const [adjustId, setAdjustId] = useState<number | null>(null);
  const [adjustVal, setAdjustVal] = useState(0);

  const review = useMutation({
    mutationFn: async (v: { id: number; action: "approve" | "reject" | "adjust"; coins?: number }) =>
      (await api.admin.returns[":id"].review.$post({ param: { id: String(v.id) }, json: { action: v.action, coins: v.coins } })).json(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-returns"] });
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      setAdjustId(null);
    },
  });

  if (isLoading) return <Loader />;
  if (!data?.returns.length) return <Empty text="No pending returns. All caught up! 🌿" />;

  return (
    <ul className="space-y-3">
      {data.returns.map((r) => {
        const est = coinsForReturn(r.containerType, r.quantity);
        return (
          <li key={r.id} className="bg-paper rounded-2xl border border-border p-4">
            <div className="flex items-start gap-3">
              <span className="size-10 grid place-items-center rounded-xl bg-cream text-moss"><Recycle size={18} /></span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-forest">{r.quantity}× {CONTAINER_LABELS[r.containerType] ?? r.containerType}</div>
                <div className="text-sm text-charcoal/55">{r.familyName ?? r.userName} family · {r.colonyName}{r.flatNumber ? ` · ${r.flatNumber}` : ""}</div>
                <div className="text-xs text-charcoal/45 mt-0.5">{r.brand ? `${r.brand} · ` : ""}{timeAgo(r.createdAt as unknown as string)}{r.note ? ` · “${r.note}”` : ""}</div>
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-moss shrink-0"><CoinIcon size={14} />{est}</span>
            </div>

            {adjustId === r.id ? (
              <div className="mt-3 flex items-center gap-2">
                <input type="number" min={0} value={adjustVal} onChange={(e) => setAdjustVal(Number(e.target.value))} aria-label="Adjust coins"
                  className="w-24 border border-border bg-card rounded-lg px-3 py-2 text-sm" />
                <button onClick={() => review.mutate({ id: r.id, action: "adjust", coins: adjustVal })} disabled={review.isPending}
                  className="bg-forest text-cream rounded-lg px-3 py-2 text-sm font-semibold">Save</button>
                <button onClick={() => setAdjustId(null)} className="text-sm text-charcoal/50">Cancel</button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <button onClick={() => review.mutate({ id: r.id, action: "approve" })} disabled={review.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-forest text-cream rounded-xl py-2.5 text-sm font-semibold"><Check size={16} /> Approve</button>
                <button onClick={() => { setAdjustId(r.id); setAdjustVal(est); }}
                  className="flex items-center justify-center gap-1.5 border border-border rounded-xl px-3 py-2.5 text-sm font-medium text-charcoal/70"><Sliders size={15} /> Adjust</button>
                <button onClick={() => review.mutate({ id: r.id, action: "reject" })} disabled={review.isPending}
                  className="flex items-center justify-center gap-1.5 border border-red-200 text-red-600 rounded-xl px-3 py-2.5 text-sm font-medium"><X size={15} /> Reject</button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Flags() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-flags"], queryFn: async () => (await api.admin.flags.$get()).json() });
  if (isLoading) return <Loader />;
  if (!data?.flags.length) return <Empty text="No open flags. Clean ledger! 🎉" />;
  return (
    <ul className="space-y-3">
      {data.flags.map((f) => (
        <li key={f.id} className="bg-paper rounded-2xl border border-border p-4 flex items-start gap-3">
          <span className={`size-10 grid place-items-center rounded-xl ${f.severity === "high" ? "bg-red-100 text-red-600" : "bg-gold/15 text-[#8a6a1f]"}`}><AlertTriangle size={18} /></span>
          <div className="flex-1">
            <div className="font-semibold text-forest capitalize">{f.severity} · {f.entityType} #{f.entityId}</div>
            <div className="text-sm text-charcoal/60">{f.reason}</div>
            <div className="text-xs text-charcoal/45 mt-0.5">{f.confidence ? `${Math.round(f.confidence * 100)}% confidence · ` : ""}{timeAgo(f.createdAt as unknown as string)} · resolve by reviewing the return</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function UsersTab() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: async () => (await api.admin.users.$get()).json() });
  if (isLoading) return <Loader />;
  return (
    <ul className="bg-paper rounded-3xl border border-border divide-y divide-border">
      {data?.users.map((u) => (
        <li key={u.id} className="flex items-center gap-3 px-4 py-3">
          <div className="size-9 rounded-full bg-forest/10 grid place-items-center font-semibold text-forest text-sm">{(u.name ?? "?")[0]}</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-forest truncate">{u.name} {u.role !== "resident" && <span className="text-xs text-moss">· {u.role}</span>}</div>
            <div className="text-xs text-charcoal/50 truncate">{u.familyName} · {u.colonyName}{u.flatNumber ? ` · ${u.flatNumber}` : ""}</div>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold tabular text-forest"><CoinIcon size={13} />{fmt(Number(u.balance))}</span>
        </li>
      ))}
    </ul>
  );
}

function RewardsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-rewards"], queryFn: async () => (await api.admin.rewards.$get()).json() });
  const toggle = useMutation({
    mutationFn: async (v: { id: number; active: boolean }) =>
      (await api.admin.rewards[":id"].$patch({ param: { id: String(v.id) }, json: { active: v.active } })).json(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-rewards"] }); qc.invalidateQueries({ queryKey: ["rewards"] }); },
  });
  if (isLoading) return <Loader />;
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {data?.rewards.map((r) => (
        <div key={r.id} className="bg-paper rounded-2xl border border-border p-3 flex gap-3 items-center">
          <img src={r.imageUrl} alt="" className="size-16 rounded-xl object-cover bg-cream" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-forest truncate">{r.title}</div>
            <div className="text-xs text-charcoal/55 flex items-center gap-1"><CoinIcon size={12} />{fmt(r.coinCost)} · stock {r.stock}</div>
            <StatusPill status={r.active ? "active" : "inactive"} />
          </div>
          <button onClick={() => toggle.mutate({ id: r.id, active: !r.active })}
            className={`text-xs font-semibold rounded-full px-3 py-1.5 ${r.active ? "bg-muted text-charcoal/60" : "bg-forest text-cream"}`}>
            {r.active ? "Disable" : "Enable"}
          </button>
        </div>
      ))}
    </div>
  );
}

function Reports() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-reports"], queryFn: async () => (await api.admin.reports.$get()).json() });
  if (isLoading) return <Loader />;
  const cards = [
    { label: "Active families", value: data?.activeFamilies },
    { label: "Total returns", value: data?.totalReturns },
    { label: "Pending review", value: data?.pending },
    { label: "Coins issued", value: data?.coinsIssued },
    { label: "Coins redeemed", value: data?.coinsRedeemed },
    { label: "Redemptions", value: data?.redemptions },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-paper rounded-2xl border border-border p-4">
            <div className="text-xs text-charcoal/55">{c.label}</div>
            <div className="font-display text-2xl font-semibold text-forest tabular mt-1">{fmt(Number(c.value ?? 0))}</div>
          </div>
        ))}
      </div>
      <div className="bg-forest text-cream rounded-2xl p-5">
        <div className="text-cream/60 text-sm">Top colony this season</div>
        <div className="font-display text-2xl font-semibold mt-1">{data?.topColony}</div>
      </div>
    </div>
  );
}

const Loader = () => <div className="py-12 grid place-items-center"><Spinner /></div>;
const Empty = ({ text }: { text: string }) => <div className="py-12 text-center text-charcoal/55">{text}</div>;
