import dotenv from "dotenv";
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export async function sendTelegram(
  chatId: string,
  message: string,
): Promise<void> {
  const url = `${TELEGRAM_API_URL}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    }),
  });

  const data = (await response.json()) as { ok: boolean; description?: string };

  if (!data.ok) {
    throw new Error(
      `Telegram API error: ${data.description ?? "Unknown error"}`,
    );
  }

  console.log(`✅ Telegram message sent to chat ${chatId}`);
}
