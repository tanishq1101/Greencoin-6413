export const COIN_RULES: Record<string, number> = {
  plastic_bottle: 10,
  glass: 15,
  can: 8,
  carton: 12,
  pouch: 5,
};

export const CONTAINERS: { value: string; label: string; emoji: string; coins: number }[] = [
  { value: "plastic_bottle", label: "Plastic Bottle", emoji: "🧴", coins: 10 },
  { value: "glass", label: "Glass Bottle", emoji: "🍾", coins: 15 },
  { value: "can", label: "Metal Can", emoji: "🥫", coins: 8 },
  { value: "carton", label: "Carton / Tetra", emoji: "📦", coins: 12 },
  { value: "pouch", label: "Pouch / Wrapper", emoji: "🛍️", coins: 5 },
];

export const CONTAINER_LABELS: Record<string, string> = Object.fromEntries(
  CONTAINERS.map((c) => [c.value, c.label]),
);

export function coinsForReturn(type: string, qty: number) {
  return (COIN_RULES[type] ?? 5) * Math.max(1, qty);
}

export function fmt(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function timeAgo(d: string | number | Date) {
  const date = new Date(d);
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
