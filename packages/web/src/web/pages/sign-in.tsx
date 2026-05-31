import { useState } from "react";
import { Link, useLocation } from "wouter";
import { authClient, captureToken } from "../lib/auth";
import { Logo, Spinner } from "../components/ui-bits";

export default function SignIn() {
  const [, nav] = useLocation();
  const [email, setEmail] = useState("demo@greencoin.app");
  const [password, setPassword] = useState("greencoin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await authClient.signIn.email(
      { email, password },
      {
        onSuccess: (ctx) => {
          captureToken(ctx);
          nav("/app");
        },
        onError: (ctx) => setError(ctx.error.message || "Could not sign in"),
      },
    );
    setLoading(false);
  };

  return (
    <div className="min-h-dvh grid md:grid-cols-2 bg-cream">
      <div className="hidden md:block relative">
        <img src="/recycle.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-forest/45" />
        <div className="absolute bottom-10 left-10 right-10 text-cream">
          <h2 className="font-display text-4xl font-semibold leading-tight">Welcome back to your colony.</h2>
          <p className="mt-3 text-cream/80 max-w-sm">Every return counts. Pick up where you left off.</p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 md:px-16 py-12">
        <Link to="/"><Logo /></Link>
        <div className="mt-10 max-w-sm">
          <h1 className="font-display text-3xl font-semibold text-forest">Sign in</h1>
          <p className="text-charcoal/60 mt-1.5">Log returns, earn coins, climb the ranks.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Field label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="input" placeholder="you@colony.com" />
            </Field>
            <Field label="Password">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="input" placeholder="••••••••" />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={loading}
              className="w-full bg-forest text-cream font-semibold rounded-xl py-3.5 hover:bg-emerald transition flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Spinner className="border-cream/40 border-t-cream" /> : "Sign in"}
            </button>
          </form>

          <div className="mt-5 rounded-xl bg-paper border border-border p-3 text-sm text-charcoal/70">
            <span className="font-medium text-forest">Quick demos:</span> resident → demo@greencoin.app · admin → admin@greencoin.app · pwd <b>greencoin123</b>
          </div>

          <p className="mt-6 text-sm text-charcoal/60">
            New here? <Link to="/sign-up" className="text-forest font-semibold">Join your colony</Link>
          </p>
        </div>
      </div>

      <style>{`.input{width:100%;border:1px solid var(--border);background:var(--card);border-radius:.75rem;padding:.8rem 1rem;font-size:15px;outline:none}.input:focus{border-color:#2f6b4f;box-shadow:0 0 0 3px rgba(47,107,79,.12)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-charcoal/75 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
