import { Link, useLocation, Redirect } from "wouter";
import { Home, PlusCircle, Trophy, Gift, Wallet, Sparkles, ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { authClient, clearToken } from "../lib/auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Logo, CoinBalance, Spinner } from "./ui-bits";

const NAV = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/log", label: "Log", icon: PlusCircle },
  { to: "/app/leaderboard", label: "Ranks", icon: Trophy },
  { to: "/app/redeem", label: "Redeem", icon: Gift },
  { to: "/app/wallet", label: "Wallet", icon: Wallet },
];

const MORE = [
  { to: "/app/helper", label: "GreenBot", icon: Sparkles },
];

export function useBalance() {
  return useQuery({
    queryKey: ["summary"],
    queryFn: async () => {
      const res = await api.returns.me.summary.$get();
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });
}

export function ProtectedRoute({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending)
    return (
      <div className="min-h-dvh grid place-items-center bg-cream">
        <Spinner />
      </div>
    );
  if (!session) return <Redirect to="/sign-in" />;
  const role = (session.user as { role?: string }).role;
  if (admin && role !== "admin" && role !== "super-admin") return <Redirect to="/app" />;
  return <>{children}</>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [loc] = useLocation();
  const { data: session } = authClient.useSession();
  const { data: summary } = useBalance();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin" || role === "super-admin";

  const signOut = async () => {
    await authClient.signOut();
    clearToken();
    window.location.href = "/";
  };

  const navItems = [...NAV, ...MORE, ...(isAdmin ? [{ to: "/app/admin", label: "Admin", icon: ShieldCheck }] : [])];

  return (
    <div className="min-h-dvh bg-cream md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-paper px-5 py-6">
        <Link to="/app" className="mb-8">
          <Logo />
        </Link>
        <nav className="flex flex-col gap-1">
          {navItems.map((n) => {
            const active = loc === n.to || (n.to !== "/app" && loc.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-forest text-cream" : "text-charcoal/70 hover:bg-muted"
                }`}
              >
                <n.icon size={19} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-6">
          <div className="rounded-2xl bg-forest text-cream p-4 mb-3">
            <div className="text-xs text-cream/60 mb-1">Your balance</div>
            <div className="flex items-center gap-2">
              <span className="inline-grid place-items-center rounded-full coin-gradient text-forest font-bold size-6 text-sm">G</span>
              <span className="font-display text-2xl font-semibold tabular">{summary?.balance ?? 0}</span>
            </div>
          </div>
          <div className="text-xs text-charcoal/60 px-1 mb-2 truncate">{session?.user?.email}</div>
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-charcoal/70 hover:text-forest px-1">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-paper/90 backdrop-blur border-b border-border">
        <Link to="/app"><Logo size={26} /></Link>
        <div className="flex items-center gap-3">
          {summary && <CoinBalance value={summary.balance} size="sm" />}
          <button onClick={() => setMenuOpen(true)} className="p-1.5"><Menu size={22} /></button>
        </div>
      </header>

      {/* Mobile slide menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-paper p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <Logo />
              <button onClick={() => setMenuOpen(false)}><X size={22} /></button>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-charcoal/80 hover:bg-muted">
                  <n.icon size={19} /> {n.label}
                </Link>
              ))}
            </nav>
            <button onClick={signOut} className="mt-auto flex items-center gap-2 text-sm text-charcoal/70 px-3 py-3">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-10">
        <div className="mx-auto w-full max-w-3xl px-4 md:px-8 py-5 md:py-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-paper/95 backdrop-blur border-t border-border">
        <div className="grid grid-cols-5 h-16">
          {NAV.map((n) => {
            const active = loc === n.to || (n.to !== "/app" && loc.startsWith(n.to));
            return (
              <Link key={n.to} to={n.to} className="flex flex-col items-center justify-center gap-0.5">
                <n.icon size={21} className={active ? "text-forest" : "text-charcoal/45"} />
                <span className={`text-[10px] font-medium ${active ? "text-forest" : "text-charcoal/45"}`}>{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
