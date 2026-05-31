import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { coinsForReturn, getBalance, getLedger } from "../lib/coins";
import { anomalyCheck } from "../lib/groq";
import type { AppVariables } from "../types";


export const returnsRoute = new Hono<{ Variables: AppVariables }>()
  // current user's balance + summary
  .get("/me/summary", requireAuth, async (c) => {
    const user = c.get("user")!;
    const balance = await getBalance(user.id);
    const [stats] = await db
      .select({
        approved: sql<number>`COALESCE(SUM(CASE WHEN ${schema.returns.status} = 'approved' THEN 1 ELSE 0 END), 0)`,
        pending: sql<number>`COALESCE(SUM(CASE WHEN ${schema.returns.status} = 'pending' THEN 1 ELSE 0 END), 0)`,
        totalQty: sql<number>`COALESCE(SUM(CASE WHEN ${schema.returns.status} = 'approved' THEN ${schema.returns.quantity} ELSE 0 END), 0)`,
      })
      .from(schema.returns)
      .where(eq(schema.returns.userId, user.id));
    return c.json({ balance, ...stats }, 200);
  })
  // current user's returns
  .get("/me", requireAuth, async (c) => {
    const user = c.get("user")!;
    const rows = await db
      .select()
      .from(schema.returns)
      .where(eq(schema.returns.userId, user.id))
      .orderBy(desc(schema.returns.createdAt));
    return c.json({ returns: rows }, 200);
  })
  // ledger history
  .get("/me/ledger", requireAuth, async (c) => {
    const user = c.get("user")!;
    const rows = await getLedger(user.id);
    return c.json({ ledger: rows }, 200);
  })
  // log a return
  .post("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const body = await c.req.json<{
      containerType: string;
      brand?: string;
      quantity: number;
      photoUrl?: string;
      note?: string;
    }>();

    const quantity = Math.max(1, Math.min(99, body.quantity || 1));

    const [created] = await db
      .insert(schema.returns)
      .values({
        userId: user.id,
        containerType: body.containerType,
        brand: body.brand,
        quantity,
        photoUrl: body.photoUrl,
        note: body.note,
        status: "pending",
      })
      .returning();

    // Background-ish anomaly check (await, but tolerate failure)
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [agg] = await db
        .select({
          recentCount: sql<number>`COUNT(*)`,
          avgQty: sql<number>`COALESCE(AVG(${schema.returns.quantity}), 0)`,
        })
        .from(schema.returns)
        .where(and(eq(schema.returns.userId, user.id), gte(schema.returns.createdAt, since)));

      const check = await anomalyCheck({
        quantity,
        containerType: body.containerType,
        recentCount: Number(agg?.recentCount ?? 0),
        avgQuantity: Number(agg?.avgQty ?? quantity),
      });
      if (check.flag) {
        await db.insert(schema.flags).values({
          entityType: "return",
          entityId: created!.id,
          userId: user.id,
          reason: check.reason,
          severity: check.severity,
          confidence: check.confidence,
          status: "open",
        });
      }
    } catch (e) {
      console.error("anomaly check failed", e);
    }

    const estimate = coinsForReturn(body.containerType, quantity);
    return c.json({ return: created, estimatedCoins: estimate }, 201);
  });
