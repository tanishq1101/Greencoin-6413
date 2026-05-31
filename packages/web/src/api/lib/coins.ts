import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc, sql } from "drizzle-orm";

// Coins awarded per container type (per unit)
export const COIN_RULES: Record<string, number> = {
  plastic_bottle: 10,
  glass: 15,
  can: 8,
  carton: 12,
  pouch: 5,
};

export const CONTAINER_LABELS: Record<string, string> = {
  plastic_bottle: "Plastic Bottle",
  glass: "Glass Bottle",
  can: "Metal Can",
  carton: "Carton / Tetra Pak",
  pouch: "Pouch / Wrapper",
};

export function coinsForReturn(containerType: string, quantity: number): number {
  const per = COIN_RULES[containerType] ?? 5;
  return per * Math.max(1, quantity);
}

export async function getBalance(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.ledger.coinsDelta}), 0)` })
    .from(schema.ledger)
    .where(eq(schema.ledger.userId, userId));
  return row?.total ?? 0;
}

/**
 * Append an immutable ledger entry. Computes balanceAfter atomically from current balance.
 */
export async function appendLedger(opts: {
  userId: string;
  transactionType: "earn" | "redeem" | "adjust" | "bonus";
  referenceType?: string;
  referenceId?: number;
  coinsDelta: number;
  description: string;
}) {
  const current = await getBalance(opts.userId);
  const balanceAfter = current + opts.coinsDelta;
  const [entry] = await db
    .insert(schema.ledger)
    .values({
      userId: opts.userId,
      transactionType: opts.transactionType,
      referenceType: opts.referenceType,
      referenceId: opts.referenceId,
      coinsDelta: opts.coinsDelta,
      balanceAfter,
      description: opts.description,
    })
    .returning();
  return entry;
}

export async function getLedger(userId: string) {
  return db
    .select()
    .from(schema.ledger)
    .where(eq(schema.ledger.userId, userId))
    .orderBy(desc(schema.ledger.createdAt));
}
