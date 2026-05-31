import { Link } from "wouter";
import { motion } from "motion/react";
import { Leaf, Recycle, Trophy, Gift, ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "../components/ui-bits";

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay: d, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Landing() {
  return (
    <div className="min-h-dvh bg-cream text-charcoal">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/sign-in" className="text-sm font-medium text-charcoal/70 hover:text-forest px-3 py-2">Sign in</Link>
            <Link to="/sign-up" className="text-sm font-semibold bg-forest text-cream rounded-full px-4 py-2 hover:bg-emerald transition">
              Join your colony
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-12 md:pt-20 pb-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <motion.span {...fade(0)} className="inline-flex items-center gap-2 text-xs font-semibold text-moss bg-moss/10 rounded-full px-3 py-1.5 mb-6">
              <Leaf size={14} /> Community recycling rewards
            </motion.span>
            <motion.h1 {...fade(0.05)} className="font-display text-5xl md:text-6xl font-semibold leading-[1.04] text-forest text-balance">
              Return a bottle.<br />Earn a reward.
            </motion.h1>
            <motion.p {...fade(0.12)} className="mt-5 text-lg text-charcoal/70 max-w-md text-balance">
              GreenCoin turns everyday recycling into GreenCoins your family can redeem for real electronics and clothing — while your neighbourhood climbs the leaderboard.
            </motion.p>
            <motion.div {...fade(0.18)} className="mt-8 flex flex-wrap gap-3">
              <Link to="/sign-up" className="inline-flex items-center gap-2 bg-forest text-cream font-semibold rounded-full px-6 py-3.5 hover:bg-emerald transition">
                Start earning <ArrowRight size={18} />
              </Link>
              <Link to="/sign-in" className="inline-flex items-center gap-2 border border-forest/25 text-forest font-semibold rounded-full px-6 py-3.5 hover:bg-paper transition">
                Try the demo
              </Link>
            </motion.div>
            <motion.p {...fade(0.24)} className="mt-4 text-sm text-charcoal/55">
              Demo login → <span className="font-medium text-forest">demo@greencoin.app</span> / greencoin123
            </motion.p>
          </div>

          <motion.div {...fade(0.1)} className="relative">
            <div className="rounded-[28px] overflow-hidden shadow-xl border border-border">
              <img src="/hero.png" alt="Green neighbourhood" className="w-full h-[420px] object-cover" />
            </div>
            <div className="absolute -bottom-5 -left-3 md:-left-6 bg-paper rounded-2xl shadow-lg border border-border p-4 w-52">
              <div className="text-xs text-charcoal/60 mb-1">This week’s top family</div>
              <div className="font-display text-lg font-semibold text-forest">The Gupta Family</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-grid place-items-center rounded-full coin-gradient text-forest font-bold size-5 text-xs">G</span>
                <span className="font-semibold tabular">525 GreenCoins</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <motion.h2 {...fade(0)} className="font-display text-3xl md:text-4xl font-semibold text-forest text-center mb-12">
          Three taps to a greener habit
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Recycle, title: "Log your return", body: "Drop empties, log the container type and quantity in under 30 seconds." },
            { icon: Trophy, title: "Earn & climb", body: "Get GreenCoins on approval and watch your family rise on the colony leaderboard." },
            { icon: Gift, title: "Redeem rewards", body: "Spend coins on earbuds, smartwatches, organic-cotton apparel and more." },
          ].map((c, i) => (
            <motion.div key={c.title} {...fade(i * 0.08)} className="bg-paper rounded-3xl border border-border p-7">
              <div className="size-12 grid place-items-center rounded-2xl bg-forest text-cream mb-5">
                <c.icon size={22} />
              </div>
              <h3 className="font-display text-xl font-semibold text-forest mb-2">{c.title}</h3>
              <p className="text-charcoal/65 text-[15px] leading-relaxed">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Rewards strip */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <motion.div {...fade(0)} className="rounded-[28px] bg-forest text-cream p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-gold-light mb-4">
              <Sparkles size={14} /> Real rewards, not points-on-paper
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3">Recycling that pays you back</h2>
            <p className="text-cream/70 max-w-md">From wireless earbuds to organic-cotton hoodies — every container you return brings a real reward closer.</p>
            <Link to="/sign-up" className="inline-flex items-center gap-2 mt-6 bg-cream text-forest font-semibold rounded-full px-6 py-3 hover:bg-gold-light transition">
              Browse rewards <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["earbuds", "smartwatch", "hoodie", "speaker", "tshirt", "tote"].map((r) => (
              <div key={r} className="rounded-2xl bg-paper overflow-hidden aspect-square border border-cream/10">
                <img src={`/rewards/${r}.png`} alt={r} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-charcoal/55">
          <Logo size={24} />
          <p>Built for greener neighbourhoods · GreenCoin</p>
        </div>
      </footer>
    </div>
  );
}
