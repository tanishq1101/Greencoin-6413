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
              <Field label="Your name"><input className="input" required value={form.name} onChange={set("name")} placeholder="Aarav Sharma" aria-label="Your name" /></Field>
              <Field label="Family name"><input className="input" required value={form.familyName} onChange={set("familyName")} placeholder="Sharma" aria-label="Family name" /></Field>
            </div>
            <Field label="Email"><input type="email" className="input" required value={form.email} onChange={set("email")} placeholder="you@colony.com" aria-label="Email" /></Field>
            <Field label="Password"><input type="password" className="input" required minLength={8} value={form.password} onChange={set("password")} placeholder="At least 8 characters" aria-label="Password" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Colony">
                <select className="input" value={form.colonyName} onChange={set("colonyName")} aria-label="Colony">
                  <option>Green Meadows</option>
                  <option>Palm Grove</option>
                  <option>Riverside Heights</option>
                </select>
              </Field>
              <Field label="Flat / House"><input className="input" required value={form.flatNumber} onChange={set("flatNumber")} placeholder="A-101" aria-label="Flat / House" /></Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-charcoal/75 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
