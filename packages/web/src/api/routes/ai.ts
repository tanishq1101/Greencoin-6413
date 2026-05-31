import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { chatHelper, categorize } from "../lib/groq";
import { getBalance } from "../lib/coins";
import type { AppVariables } from "../types";


export const aiRoute = new Hono<{ Variables: AppVariables }>()
  .post("/chat", requireAuth, async (c) => {
    const user = c.get("user")!;
    const { messages } = await c.req.json<{
      messages: { role: "user" | "assistant"; content: string }[];
    }>();
    const balance = await getBalance(user.id);
    const context = `Name: ${user.name ?? "resident"}. Family: ${user.familyName ?? "n/a"}. Current GreenCoin balance: ${balance}.`;
    try {
      const reply = await chatHelper(messages.slice(-10), context);
      return c.json({ reply }, 200);
    } catch (e) {
      console.error("groq chat error", e);
      return c.json({ reply: "GreenBot is resting right now. Try again in a moment." }, 200);
    }
  })
  .post("/categorize", requireAuth, async (c) => {
    const { text } = await c.req.json<{ text: string }>();
    try {
      const result = await categorize(text);
      return c.json(result, 200);
    } catch (e) {
      console.error("groq categorize error", e);
      return c.json({ containerType: "plastic_bottle", confidence: 0, reasoning: "" }, 200);
    }
  });
