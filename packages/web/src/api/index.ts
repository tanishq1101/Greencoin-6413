import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { authMiddleware } from "./middleware/auth";
import { returnsRoute } from "./routes/returns";
import { rewardsRoute } from "./routes/rewards";
import { leaderboardRoute } from "./routes/leaderboard";
import { adminRoute } from "./routes/admin";
import { aiRoute } from "./routes/ai";

type Variables = {
  user: (typeof auth.$Infer.Session)["user"] | null;
  session: (typeof auth.$Infer.Session)["session"] | null;
};

const app = new Hono<{ Variables: Variables }>()
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true, exposeHeaders: ["set-auth-token"] }))
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .basePath("api")
  .use("*", authMiddleware)
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .get("/me", (c) => {
    const user = c.get("user");
    if (!user) return c.json({ user: null }, 200);
    return c.json({ user }, 200);
  })
  .route("/returns", returnsRoute)
  .route("/rewards", rewardsRoute)
  .route("/leaderboard", leaderboardRoute)
  .route("/admin", adminRoute)
  .route("/ai", aiRoute);

export type AppType = typeof app;
export default app;
