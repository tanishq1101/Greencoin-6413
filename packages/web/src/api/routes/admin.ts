import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";
import { coinsForReturn, appendLedger } from "../lib/coins";
import type { AppVariables } from "../types";


export const adminRoute = new Hono<{ Variables: AppVariables }>()
  .use("*", requireAdmin)
  // review queue with user info
  .get("/returns", async (c) => {
    const status = c.req.query("status");
    const base = db
      .select({
        id: schema.returns.id,
        userId: schema.returns.userId,
        userName: schema.user.name,
        familyName: schema.user.familyName,
        colonyName: schema.user.colonyName,
        flatNumber: schema.user.flatNumber,
        containerType: schema.returns.containerType,
        brand: schema.returns.brand,
        quantity: schema.returns.quantity,
        photoUrl: schema.returns.photoUrl,
        note: schema.returns.note,
        status: schema.returns.status,
        coinsAwarded: schema.returns.coinsAwarded,
        createdAt: schema.returns.createdAt,
      })
      .from(schema.returns)
      .leftJoin(schema.user, eq(schema.user.id, schema.returns.userId))
      .orderBy(desc(schema.returns.createdAt));
    const rows = status
      ? await base.where(eq(schema.returns.status, status))
      : await base;
    return c.json({ returns: rows }, 200);
  })
  // approve / reject / adjust a return
  .post(
    "/returns/:id/review",
    zValidator(
      "json",
      z.object({
        action: z.enum(["approve", "reject", "adjust"]),
        coins: z.number().optional(),
        note: z.string().optional(),
      }),
    ),
    async (c) => {
    const admin = c.get("user")!;
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");

    const [ret] = await db.select().from(schema.returns).where(eq(schema.returns.id, id));
    if (!ret) return c.json({ message: "Return not found" }, 404);
    if (ret.status !== "pending") return c.json({ message: "Already reviewed" }, 409);

    if (body.action === "reject") {
      await db
        .update(schema.returns)
        .set({ status: "rejected", reviewedBy: admin.id, reviewedAt: new Date(), reviewNote: body.note })
        .where(eq(schema.returns.id, id));
      // resolve any open flags
      await db.update(schema.flags).set({ status: "resolved" }).where(and(eq(schema.flags.entityType, "return"), eq(schema.flags.entityId, id)));
      return c.json({ ok: true, status: "rejected" }, 200);
    }

    const coins =
      body.action === "adjust" && typeof body.coins === "number"
        ? Math.max(0, body.coins)
        : coinsForReturn(ret.containerType, ret.quantity);
    const newStatus = body.action === "adjust" ? "adjusted" : "approved";

    await db
      .update(schema.returns)
      .set({
        status: newStatus,
        coinsAwarded: coins,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        reviewNote: body.note,
      })
      .where(eq(schema.returns.id, id));

    if (coins > 0) {
      await appendLedger({
        userId: ret.userId,
        transactionType: "earn",
        referenceType: "return",
        referenceId: ret.id,
        coinsDelta: coins,
        description: `Approved return: ${ret.quantity}x ${ret.containerType.replace(/_/g, " ")}`,
      });
    }
    await db.update(schema.flags).set({ status: "resolved" }).where(and(eq(schema.flags.entityType, "return"), eq(schema.flags.entityId, id)));

    return c.json({ ok: true, status: newStatus, coins }, 200);
  },
  )
  // flags
  .get("/flags", async (c) => {
    const rows = await db.select().from(schema.flags).where(eq(schema.flags.status, "open")).orderBy(desc(schema.flags.createdAt));
    return c.json({ flags: rows }, 200);
  })
  // users
  .get("/users", async (c) => {
    const rows = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        role: schema.user.role,
        familyName: schema.user.familyName,
        colonyName: schema.user.colonyName,
        flatNumber: schema.user.flatNumber,
        balance: sql<number>`COALESCE((SELECT SUM(${schema.ledger.coinsDelta}) FROM ${schema.ledger} WHERE ${schema.ledger.userId} = ${schema.user.id}), 0)`,
      })
      .from(schema.user)
      .orderBy(schema.user.name);
    return c.json({ users: rows }, 200);
  })
  // rewards management
  .get("/rewards", async (c) => {
    const rows = await db.select().from(schema.rewards).orderBy(schema.rewards.coinCost);
    return c.json({ rewards: rows }, 200);
  })
  .post("/rewards", async (c) => {
    const body = await c.req.json();
    const [created] = await db.insert(schema.rewards).values(body).returning();
    return c.json({ reward: created }, 201);
  })
  .patch(
    "/rewards/:id",
    zValidator(
      "json",
      z.object({
        active: z.boolean().optional(),
        title: z.string().optional(),
        coinCost: z.number().optional(),
        stock: z.number().optional(),
      }),
    ),
    async (c) => {
      const id = Number(c.req.param("id"));
      const body = c.req.valid("json");
      const [updated] = await db.update(schema.rewards).set(body).where(eq(schema.rewards.id, id)).returning();
      return c.json({ reward: updated }, 200);
    },
  )
  // reports / KPIs
  .get("/reports", async (c) => {
    const [totals] = await db
      .select({
        totalReturns: sql<number>`COUNT(*)`,
        approved: sql<number>`COALESCE(SUM(CASE WHEN ${schema.returns.status} IN ('approved','adjusted') THEN 1 ELSE 0 END),0)`,
        pending: sql<number>`COALESCE(SUM(CASE WHEN ${schema.returns.status} = 'pending' THEN 1 ELSE 0 END),0)`,
      })
      .from(schema.returns);
    const [coins] = await db
      .select({
        issued: sql<number>`COALESCE(SUM(CASE WHEN ${schema.ledger.coinsDelta} > 0 THEN ${schema.ledger.coinsDelta} ELSE 0 END),0)`,
        redeemed: sql<number>`COALESCE(SUM(CASE WHEN ${schema.ledger.coinsDelta} < 0 THEN -${schema.ledger.coinsDelta} ELSE 0 END),0)`,
      })
      .from(schema.ledger);
    const [families] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.user).where(eq(schema.user.role, "resident"));
    const [reds] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.redemptions);
    const [topColony] = await db
      .select({ colony: schema.user.colonyName, score: sql<number>`COALESCE(SUM(${schema.ledger.coinsDelta}),0)` })
      .from(schema.user)
      .leftJoin(schema.ledger, and(eq(schema.ledger.userId, schema.user.id), sql`${schema.ledger.coinsDelta} > 0`))
      .groupBy(schema.user.colonyName)
      .orderBy(sql`COALESCE(SUM(${schema.ledger.coinsDelta}),0) DESC`)
      .limit(1);
    return c.json(
      {
        totalReturns: Number(totals?.totalReturns ?? 0),
        approved: Number(totals?.approved ?? 0),
        pending: Number(totals?.pending ?? 0),
        coinsIssued: Number(coins?.issued ?? 0),
        coinsRedeemed: Number(coins?.redeemed ?? 0),
        activeFamilies: Number(families?.count ?? 0),
        redemptions: Number(reds?.count ?? 0),
        topColony: topColony?.colony ?? "—",
      },
      200,
    );
  });
