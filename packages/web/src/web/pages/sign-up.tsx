import { useState } from "react";
import { Link, useLocation } from "wouter";
import { authClient, captureToken } from "../lib/auth";
import { Logo, Spinner } from "../components/ui-bits";

export default function SignUp() {
  const [, nav] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "", familyName: "", colonyName: "Green Meadows", flatNumber: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await authClient.signUp.email(
      {
        email: form.email,
        password: form.password,
        name: form.name,
        familyName: form.familyName,
        colonyName: form.colonyName,
        flatNumber: form.flatNumber,
      } as never,
      {
        onSuccess: (ctx) => {
          captureToken(ctx);
          nav("/app");
        },
        onError: (ctx) => setError(ctx.error.message || "Could not create account"),
      },
    );
    setLoading(false);
  };

  return (
    <div className="min-h-dvh grid md:grid-cols-2 bg-cream">
      <div className="flex flex-col justify-center px-6 md:px-16 py-12 order-2 md:order-1">
        <Link to="/"><Logo /></Link>
        <div className="mt-8 max-w-md">
          <h1 className="font-display text-3xl font-semibold text-forest">Join your colony</h1>
          <p className="text-charcoal/60 mt-1.5">Create a family profile and start earning GreenCoins.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="block" htmlFor="signup-name">
                <span className="text-sm font-medium text-charcoal/75 mb-1.5 block">Your name</span>
                <input id="signup-name" className="input" required value={form.name} onChange={set("name")} placeholder="Aarav Sharma" aria-label="Your name" />
              </label>
              <label className="block" htmlFor="signup-family-name">
                <span className="text-sm font-medium text-charcoal/75 mb-1.5 block">Family name</span>
                <input id="signup-family-name" className="input" required value={form.familyName} onChange={set("familyName")} placeholder="Sharma" aria-label="Family name" />
              </label>
            </div>
            <label className="block" htmlFor="signup-email">
              <span className="text-sm font-medium text-charcoal/75 mb-1.5 block">Email</span>
              <input id="signup-email" type="email" className="input" required value={form.email} onChange={set("email")} placeholder="you@colony.com" aria-label="Email" />
            </label>
            <label className="block" htmlFor="signup-password">
              <span className="text-sm font-medium text-charcoal/75 mb-1.5 block">Password</span>
              <input id="signup-password" type="password" className="input" required minLength={8} value={form.password} onChange={set("password")} placeholder="At least 8 characters" aria-label="Password" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block" htmlFor="signup-colony">
                <span className="text-sm font-medium text-charcoal/75 mb-1.5 block">Colony</span>
                <select id="signup-colony" className="input" value={form.colonyName} onChange={set("colonyName")} aria-label="Colony">
                  <option>Green Meadows</option>
                  <option>Palm Grove</option>
                  <option>Riverside Heights</option>
                </select>
              </label>
              <label className="block" htmlFor="signup-flat">
                <span className="text-sm font-medium text-charcoal/75 mb-1.5 block">Flat / House</span>
                <input id="signup-flat" className="input" required value={form.flatNumber} onChange={set("flatNumber")} placeholder="A-101" aria-label="Flat / House" />
              </label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={loading}
              className="w-full bg-forest text-cream font-semibold rounded-xl py-3.5 hover:bg-emerald transition flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Spinner className="border-cream/40 border-t-cream" /> : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-sm text-charcoal/60">
            Already a member? <Link to="/sign-in" className="text-forest font-semibold">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="hidden md:block relative order-1 md:order-2">
        <img src="/hero.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-forest/40" />
        <div className="absolute bottom-10 left-10 right-10 text-cream">
          <h2 className="font-display text-4xl font-semibold leading-tight">Small returns, real rewards.</h2>
          <p className="mt-3 text-cream/80 max-w-sm">Join 10+ families already turning recycling into earbuds, watches and apparel.</p>
        </div>
      </div>

      <style>{`.input{width:100%;border:1px solid var(--border);background:var(--card);border-radius:.75rem;padding:.8rem 1rem;font-size:15px;outline:none}.input:focus{border-color:#2f6b4f;box-shadow:0 0 0 3px rgba(47,107,79,.12)}`}</style>
    </div>
  );
}
