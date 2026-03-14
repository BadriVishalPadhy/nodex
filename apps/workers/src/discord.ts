import dotenv from "dotenv";
dotenv.config();

const MAX_RETRIES = 3;

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function sendDiscord(
  webhookUrl: string,
  content: string,
  username?: string,
  avatarUrl?: string,
): Promise<void> {
  if (!webhookUrl || !webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    throw new Error("Invalid Discord webhook URL");
  }

  const payload: Record<string, unknown> = { content };
  if (username) payload.username = username;
  if (avatarUrl) payload.avatar_url = avatarUrl;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Handle Discord rate limiting (429)
      if (response.status === 429) {
        const data = (await response.json()) as { retry_after?: number };
        const retryAfter = (data.retry_after ?? 1) * 1000;
        console.warn(`Discord rate limited, retrying after ${retryAfter}ms (attempt ${attempt}/${MAX_RETRIES})`);
        await sleep(retryAfter);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Discord API error ${response.status}: ${errorText}`);
      }

      console.log("✅ Discord message sent");
      return;
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      console.warn(`Discord send failed (attempt ${attempt}/${MAX_RETRIES}), retrying...`);
      await sleep(1000 * attempt);
    }
  }
}
