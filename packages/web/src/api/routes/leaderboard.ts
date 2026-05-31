import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { sql, gte, and, eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import type { AppVariables } from "../types";


function periodStart(period: string): Date | null {
  const now = new Date();
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "month") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  return null; // all time
}

export const leaderboardRoute = new Hono<{ Variables: AppVariables }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const period = c.req.query("period") ?? "all";
    const start = periodStart(period);

    // Rank by earned coins (positive earn/bonus ledger deltas) within period
    const conditions = [sql`${schema.ledger.coinsDelta} > 0`];
    if (start) conditions.push(gte(schema.ledger.createdAt, start));

    const rows = await db
      .select({
        userId: schema.user.id,
        name: schema.user.name,
        familyName: schema.user.familyName,
        colonyName: schema.user.colonyName,
        flatNumber: schema.user.flatNumber,
        score: sql<number>`COALESCE(SUM(${schema.ledger.coinsDelta}), 0)`,
        returns: sql<number>`COUNT(DISTINCT CASE WHEN ${schema.ledger.referenceType} = 'return' THEN ${schema.ledger.referenceId} END)`,
      })
      .from(schema.user)
      .leftJoin(
        schema.ledger,
        and(eq(schema.ledger.userId, schema.user.id), ...conditions),
      )
      .groupBy(schema.user.id)
      .orderBy(sql`COALESCE(SUM(${schema.ledger.coinsDelta}), 0) DESC`);

    const ranked = rows
      .map((r, i) => ({ ...r, score: Number(r.score), returns: Number(r.returns), rank: i + 1 }))
      .filter((r) => r.score > 0 || true);

    const me = c.get("user");
    let myRank: (typeof ranked)[number] | null = null;
    let deltaToNext = 0;
    if (me) {
      const idx = ranked.findIndex((r) => r.userId === me.id);
      if (idx >= 0) {
        myRank = ranked[idx]!;
        if (idx > 0) deltaToNext = ranked[idx - 1]!.score - myRank.score;
      }
    }

    return c.json({ leaderboard: ranked.slice(0, 25), myRank, deltaToNext, period }, 200);
  });
