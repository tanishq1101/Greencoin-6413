import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { getBalance, appendLedger } from "../lib/coins";
import type { AppVariables } from "../types";


function genCode() {
  return "GC-" + Math.random().toString(36).slice(2, 7).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export const rewardsRoute = new Hono<{ Variables: AppVariables }>()
  .get("/", async (c) => {
    const rows = await db
      .select()
      .from(schema.rewards)
      .where(eq(schema.rewards.active, true))
      .orderBy(schema.rewards.coinCost);
    return c.json({ rewards: rows }, 200);
  })
  .get("/me/redemptions", requireAuth, async (c) => {
    const user = c.get("user")!;
    const rows = await db
      .select()
      .from(schema.redemptions)
      .where(eq(schema.redemptions.userId, user.id))
      .orderBy(desc(schema.redemptions.createdAt));
    return c.json({ redemptions: rows }, 200);
  })
  .post("/:id/redeem", requireAuth, async (c) => {
    const user = c.get("user")!;
    const id = Number(c.req.param("id"));
    const [reward] = await db.select().from(schema.rewards).where(eq(schema.rewards.id, id));
    if (!reward || !reward.active) return c.json({ message: "Reward not available" }, 404);
    if (reward.stock <= 0) return c.json({ message: "Out of stock" }, 409);

    const balance = await getBalance(user.id);
    if (balance < reward.coinCost) {
      return c.json({ message: "Not enough GreenCoins", balance, needed: reward.coinCost }, 402);
    }

    const code = genCode();
    const [redemption] = await db
      .insert(schema.redemptions)
      .values({
        userId: user.id,
        rewardId: reward.id,
        rewardTitle: reward.title,
        coinsSpent: reward.coinCost,
        code,
        status: "confirmed",
      })
      .returning();

    await appendLedger({
      userId: user.id,
      transactionType: "redeem",
      referenceType: "redemption",
      referenceId: redemption!.id,
      coinsDelta: -reward.coinCost,
      description: `Redeemed: ${reward.title}`,
    });

    await db
      .update(schema.rewards)
      .set({ stock: reward.stock - 1 })
      .where(eq(schema.rewards.id, reward.id));

    const newBalance = await getBalance(user.id);
    return c.json({ redemption, code, newBalance }, 201);
  });
