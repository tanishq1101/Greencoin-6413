import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const GROQ_MODEL = "llama-3.3-70b-versatile";

const HELPER_SYSTEM = `You are GreenBot, the friendly assistant inside GreenCoin — a community recycling rewards app.
Residents return empty FMCG containers (plastic bottles, glass, cans, cartons, pouches) to earn GreenCoins, then redeem coins for rewards like electronics and clothing.

Coin rules per item: plastic bottle = 10, glass = 15, can = 8, carton = 12, pouch = 5.

Your job:
- Explain how to log a return, check the wallet, view the leaderboard, and redeem rewards.
- Suggest the correct container category when users describe what they're recycling.
- Recommend reward targets based on a user's balance when asked.
- Keep answers short, warm, community-minded, and actionable. No guilt language.
- If asked something off-topic, gently steer back to recycling and the app.`;

export async function chatHelper(messages: { role: "user" | "assistant"; content: string }[], context?: string) {
  const sys = context ? `${HELPER_SYSTEM}\n\nUser context: ${context}` : HELPER_SYSTEM;
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.6,
    max_tokens: 600,
    messages: [{ role: "system", content: sys }, ...messages],
  });
  return completion.choices[0]?.message?.content ?? "Sorry, I couldn't respond just now.";
}

/**
 * Smart categorization — returns structured JSON suggesting container type.
 */
export async function categorize(text: string): Promise<{
  containerType: string;
  confidence: number;
  reasoning: string;
}> {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Classify a recycled FMCG container into one category. Respond ONLY with JSON.
Categories: plastic_bottle, glass, can, carton, pouch.
Schema: {"containerType": string, "confidence": number (0-1), "reasoning": string (short)}.
If unsure, set confidence below 0.5.`,
      },
      { role: "user", content: text },
    ],
  });
  try {
    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    const valid = ["plastic_bottle", "glass", "can", "carton", "pouch"];
    return {
      containerType: valid.includes(parsed.containerType) ? parsed.containerType : "plastic_bottle",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.4,
      reasoning: parsed.reasoning ?? "",
    };
  } catch {
    return { containerType: "plastic_bottle", confidence: 0.3, reasoning: "Could not classify; needs review." };
  }
}

/**
 * Anomaly check on a new return submission. Returns a structured flag or null.
 */
export async function anomalyCheck(opts: {
  quantity: number;
  containerType: string;
  recentCount: number; // submissions in last 24h
  avgQuantity: number;
}): Promise<{ flag: boolean; severity: "low" | "medium" | "high"; confidence: number; reason: string }> {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a fraud/anomaly detector for a recycling rewards app. Decide if a return submission is suspicious.
Respond ONLY with JSON: {"flag": boolean, "severity": "low"|"medium"|"high", "confidence": number 0-1, "reason": string short}.
Suspicious signals: very high quantity (>40), many submissions in 24h (>8), quantity far above the user's average.`,
      },
      {
        role: "user",
        content: `quantity=${opts.quantity}, containerType=${opts.containerType}, submissionsLast24h=${opts.recentCount}, userAvgQuantity=${opts.avgQuantity.toFixed(1)}`,
      },
    ],
  });
  try {
    const p = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return {
      flag: !!p.flag,
      severity: ["low", "medium", "high"].includes(p.severity) ? p.severity : "medium",
      confidence: typeof p.confidence === "number" ? p.confidence : 0.5,
      reason: p.reason ?? "Pattern flagged for review.",
    };
  } catch {
    return { flag: false, severity: "low", confidence: 0, reason: "" };
  }
}
