/**
 * Seed script — run with: bun run src/api/seed.ts
 * Creates an admin, ~10 resident families, approved returns + ledger, and the reward catalog.
 */
import { db } from "./database";
import * as schema from "./database/schema";
import { auth } from "./auth";
import { eq, sql } from "drizzle-orm";
import { coinsForReturn, appendLedger } from "./lib/coins";

const COLONIES = ["Green Meadows", "Palm Grove", "Riverside Heights"];

const FAMILIES = [
  { name: "Aarav Sharma", family: "Sharma", colony: "Green Meadows", flat: "A-101" },
  { name: "Diya Patel", family: "Patel", colony: "Green Meadows", flat: "A-204" },
  { name: "Vihaan Reddy", family: "Reddy", colony: "Green Meadows", flat: "B-102" },
  { name: "Ananya Iyer", family: "Iyer", colony: "Palm Grove", flat: "C-301" },
  { name: "Kabir Nair", family: "Nair", colony: "Palm Grove", flat: "C-105" },
  { name: "Saanvi Gupta", family: "Gupta", colony: "Palm Grove", flat: "D-202" },
  { name: "Arjun Mehta", family: "Mehta", colony: "Riverside Heights", flat: "E-401" },
  { name: "Ishaan Rao", family: "Rao", colony: "Riverside Heights", flat: "E-103" },
  { name: "Myra Joshi", family: "Joshi", colony: "Riverside Heights", flat: "F-205" },
  { name: "Reyansh Das", family: "Das", colony: "Green Meadows", flat: "B-303" },
];

const CONTAINER_TYPES = ["plastic_bottle", "glass", "can", "carton", "pouch"];
const BRANDS = ["Bisleri", "Coca-Cola", "Amul", "Tropicana", "Lay's", "Frooti", "Maaza", "Kissan"];

const REWARDS = [
  { title: "AuraPods Wireless Earbuds", description: "True-wireless earbuds with active noise cancellation and 24h battery.", category: "electronics", coinCost: 480, imageUrl: "/rewards/earbuds.png", brand: "Aura", stock: 12 },
  { title: "Verde Smartwatch", description: "Fitness smartwatch with heart-rate, GPS and a 7-day battery.", category: "electronics", coinCost: 720, imageUrl: "/rewards/smartwatch.png", brand: "Verde", stock: 8 },
  { title: "Grove Bluetooth Speaker", description: "Portable 360° speaker, 12h playtime, water-resistant fabric.", category: "electronics", coinCost: 360, imageUrl: "/rewards/speaker.png", brand: "Grove", stock: 15 },
  { title: "Sage 10,000mAh Power Bank", description: "Slim fast-charge power bank made with recycled aluminium.", category: "electronics", coinCost: 220, imageUrl: "/rewards/powerbank.png", brand: "Sage", stock: 30 },
  { title: "Organic Cotton Hoodie", description: "Cozy hoodie made from 100% GOTS-certified organic cotton.", category: "clothing", coinCost: 300, imageUrl: "/rewards/hoodie.png", brand: "EarthWear", stock: 20 },
  { title: "Leaf Logo T-Shirt", description: "Soft everyday tee in undyed organic cotton with embroidered leaf.", category: "clothing", coinCost: 120, imageUrl: "/rewards/tshirt.png", brand: "EarthWear", stock: 50 },
  { title: "Canvas Tote Bag", description: "Sturdy reusable tote in undyed cotton canvas — say no to plastic.", category: "clothing", coinCost: 70, imageUrl: "/rewards/tote.png", brand: "EarthWear", stock: 80 },
  { title: "Forest Wool Beanie", description: "Warm knitted beanie in recycled wool blend.", category: "clothing", coinCost: 95, imageUrl: "/rewards/beanie.png", brand: "EarthWear", stock: 40 },
];

async function ensureUser(email: string, password: string, fields: { name: string; role: string; familyName?: string; colonyName?: string; flatNumber?: string }) {
  const existing = await db.select().from(schema.user).where(eq(schema.user.email, email));
  if (existing.length) return existing[0]!.id;
  await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: fields.name,
      // additional fields
      familyName: fields.familyName,
      colonyName: fields.colonyName,
      flatNumber: fields.flatNumber,
    } as any,
  });
  const [u] = await db.select().from(schema.user).where(eq(schema.user.email, email));
  if (fields.role !== "resident") {
    await db.update(schema.user).set({ role: fields.role }).where(eq(schema.user.id, u!.id));
  } else {
    await db.update(schema.user).set({ role: "resident" }).where(eq(schema.user.id, u!.id));
  }
  return u!.id;
}

function randInt(a: number, b: number) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

async function main() {
  console.log("Seeding GreenCoin...");

  // wipe domain data (keep auth users to avoid orphan churn; but reset ledger/returns/rewards/redemptions/flags)
  await db.delete(schema.flags);
  await db.delete(schema.redemptions);
  await db.delete(schema.ledger);
  await db.delete(schema.returns);
  await db.delete(schema.rewards);

  // admin
  const adminId = await ensureUser("admin@greencoin.app", "greencoin123", {
    name: "Priya Volunteer",
    role: "admin",
    familyName: "Admin",
    colonyName: "Green Meadows",
    flatNumber: "Office",
  });
  console.log("admin:", adminId);

  // residents
  const ids: { id: string; idx: number }[] = [];
  for (let i = 0; i < FAMILIES.length; i++) {
    const f = FAMILIES[i]!;
    const email = `${f.family.toLowerCase()}@greencoin.app`;
    const id = await ensureUser(email, "greencoin123", {
      name: f.name,
      role: "resident",
      familyName: f.family,
      colonyName: f.colony,
      flatNumber: f.flat,
    });
    ids.push({ id, idx: i });
  }

  // demo resident with a nice balance
  const demoId = await ensureUser("demo@greencoin.app", "greencoin123", {
    name: "Demo Resident",
    role: "resident",
    familyName: "Demo",
    colonyName: "Green Meadows",
    flatNumber: "A-001",
  });
  ids.push({ id: demoId, idx: 99 });

  // rewards catalog
  await db.insert(schema.rewards).values(REWARDS.map((r) => ({ ...r, active: true })));
  console.log("rewards seeded:", REWARDS.length);

  // returns + ledger (approved) per family — vary volume so leaderboard is interesting
  for (const { id, idx } of ids) {
    const count = idx === 99 ? 14 : randInt(3, 12);
    for (let r = 0; r < count; r++) {
      const ct = pick(CONTAINER_TYPES);
      const qty = randInt(1, 6);
      const daysAgo = randInt(0, 27);
      const created = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - randInt(0, 12) * 3600 * 1000);
      const coins = coinsForReturn(ct, qty);
      const [ret] = await db
        .insert(schema.returns)
        .values({
          userId: id,
          containerType: ct,
          brand: pick(BRANDS),
          quantity: qty,
          status: "approved",
          coinsAwarded: coins,
          reviewedBy: adminId,
          reviewedAt: created,
          createdAt: created,
        })
        .returning();
      await appendLedger({
        userId: id,
        transactionType: "earn",
        referenceType: "return",
        referenceId: ret!.id,
        coinsDelta: coins,
        description: `Approved return: ${qty}x ${ct.replace(/_/g, " ")}`,
      });
    }
    // a couple of pending returns for the admin queue (first 3 residents + demo)
    if (idx < 3 || idx === 99) {
      const ct = pick(CONTAINER_TYPES);
      const qty = idx === 99 ? 3 : randInt(1, 4);
      await db.insert(schema.returns).values({
        userId: id,
        containerType: ct,
        brand: pick(BRANDS),
        quantity: qty,
        status: "pending",
      });
    }
  }

  // one suspicious pending return -> flag
  const suspect = ids[0]!;
  const [bigRet] = await db
    .insert(schema.returns)
    .values({ userId: suspect.id, containerType: "plastic_bottle", brand: "Bisleri", quantity: 60, status: "pending", note: "bulk drop" })
    .returning();
  await db.insert(schema.flags).values({
    entityType: "return",
    entityId: bigRet!.id,
    userId: suspect.id,
    reason: "Unusually high quantity (60) far above user average.",
    severity: "high",
    confidence: 0.86,
    status: "open",
  });

  const balances = await db
    .select({ name: schema.user.name, bal: sql<number>`COALESCE((SELECT SUM(${schema.ledger.coinsDelta}) FROM ${schema.ledger} WHERE ${schema.ledger.userId} = ${schema.user.id}),0)` })
    .from(schema.user);
  console.log("balances:", balances.map((b) => `${b.name}: ${b.bal}`).join(", "));
  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
