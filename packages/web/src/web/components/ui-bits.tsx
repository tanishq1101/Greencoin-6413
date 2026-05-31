import { useEffect, useRef, useState } from "react";
import { Leaf } from "lucide-react";
import { fmt } from "../lib/constants";

export function Logo({ size = 28, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="grid place-items-center rounded-xl coin-gradient text-forest shadow-sm"
        style={{ width: size, height: size }}
      >
        <Leaf size={size * 0.58} strokeWidth={2.4} />
      </span>
      {withText && (
        <span className="font-display text-xl font-semibold tracking-tight text-forest">
          GreenCoin
        </span>
      )}
    </div>
  );
}

export function CoinIcon({ size = 18 }: { size?: number }) {
  return (
    <span
      className="inline-grid place-items-center rounded-full coin-gradient text-forest font-bold shadow-sm shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.6 }}
    >
      G
    </span>
  );
}

export function CountUp({ value, duration = 900, className = "" }: { value: number; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else ref.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={`tabular ${className}`}>{fmt(display)}</span>;
}

export function CoinBalance({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "text-4xl" : size === "sm" ? "text-base" : "text-2xl";
  const icon = size === "lg" ? 30 : size === "sm" ? 16 : 22;
  return (
    <div className="flex items-center gap-2">
      <CoinIcon size={icon} />
      <CountUp value={value} className={`font-display font-semibold text-forest ${cls}`} />
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-moss/15 text-moss",
    adjusted: "bg-moss/15 text-moss",
    pending: "bg-gold/20 text-[#8a6a1f]",
    rejected: "bg-red-100 text-red-700",
    confirmed: "bg-moss/15 text-moss",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block size-5 rounded-full border-2 border-forest/30 border-t-forest animate-spin ${className}`} />
  );
}

export function celebrate() {
  import("canvas-confetti").then(({ default: confetti }) => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#C9A24B", "#E3C16F", "#2F6B4F", "#14342B"],
    });
  });
}
