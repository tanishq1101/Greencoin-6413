import { createMiddleware } from "hono/factory";
import { auth } from "../auth";

export const authMiddleware = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);
  return next();
});

export const requireAuth = createMiddleware(async (c, next) => {
  if (!c.get("user")) return c.json({ message: "Unauthorized" }, 401);
  return next();
});

export const requireAdmin = createMiddleware(async (c, next) => {
  const user = c.get("user") as { role?: string } | null;
  if (!user) return c.json({ message: "Unauthorized" }, 401);
  if (user.role !== "admin" && user.role !== "super-admin") {
    return c.json({ message: "Forbidden" }, 403);
  }
  return next();
});
