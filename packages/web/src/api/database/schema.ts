import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

// Re-export auth tables so drizzle picks them up for migrations
export * from "./auth-schema";

/**
 * Container returns logged by residents.
 * status: pending | approved | rejected | adjusted
 */
export const returns = sqliteTable("returns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  containerType: text("container_type").notNull(), // plastic_bottle, glass, can, carton, pouch
  brand: text("brand"),
  quantity: integer("quantity").notNull().default(1),
  photoUrl: text("photo_url"),
  note: text("note"),
  status: text("status").notNull().default("pending"),
  coinsAwarded: integer("coins_awarded").notNull().default(0),
  reviewedBy: text("reviewed_by"),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  reviewNote: text("review_note"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Immutable GreenCoin ledger. Balance = sum of coinsDelta for a user.
 * transactionType: earn | redeem | adjust | bonus
 */
export const ledger = sqliteTable("ledger", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  transactionType: text("transaction_type").notNull(),
  referenceType: text("reference_type"), // return | redemption | admin
  referenceId: integer("reference_id"),
  coinsDelta: integer("coins_delta").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  description: text("description").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Reward catalog — electronics & clothing.
 * category: electronics | clothing
 */
export const rewards = sqliteTable("rewards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  coinCost: integer("coin_cost").notNull(),
  imageUrl: text("image_url").notNull(),
  brand: text("brand"),
  stock: integer("stock").notNull().default(50),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Redemption records.
 * status: confirmed | fulfilled | cancelled
 */
export const redemptions = sqliteTable("redemptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  rewardId: integer("reward_id").notNull().references(() => rewards.id),
  rewardTitle: text("reward_title").notNull(),
  coinsSpent: integer("coins_spent").notNull(),
  code: text("code").notNull(),
  status: text("status").notNull().default("confirmed"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Audit / anomaly flags raised on submissions.
 * severity: low | medium | high  | status: open | resolved
 */
export const flags = sqliteTable("flags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityType: text("entity_type").notNull(), // return
  entityId: integer("entity_id").notNull(),
  userId: text("user_id"),
  reason: text("reason").notNull(),
  severity: text("severity").notNull().default("medium"),
  confidence: real("confidence"),
  status: text("status").notNull().default("open"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
