import { tool } from "ai";
import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

// ─── Email Tool ─────────────────────────────────────────────────────
// Uses SendGrid directly (mirrors apps/workers/src/email.ts logic)
async function executeSendEmail(to: string, subject: string, body: string) {
  const sgMail = require("@sendgrid/mail");
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SENDGRID_API_KEY not configured");
  sgMail.setApiKey(apiKey);

  const [response] = await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL || "noreply@example.com",
    subject,
    html: body,
  });

  return {
    success: true,
    statusCode: response.statusCode,
    message: `Email sent to ${to}`,
  };
}

// ─── Discord Tool ───────────────────────────────────────────────────
async function executeSendDiscord(
  webhookUrl: string,
  content: string,
  username?: string,
) {
  if (!webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    throw new Error("Invalid Discord webhook URL");
  }

  const payload: Record<string, unknown> = { content };
  if (username) payload.username = username;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord API error ${response.status}: ${errorText}`);
  }

  return { success: true, message: "Discord message sent" };
}

// ─── Telegram Tool ──────────────────────────────────────────────────
async function executeSendTelegram(chatId: string, message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not configured");

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API error ${response.status}: ${errorText}`);
  }

  return { success: true, message: `Telegram message sent to chat ${chatId}` };
}

// ─── Tool Definitions ───────────────────────────────────────────────
// These use Zod schemas so the Vercel AI SDK can generate proper
// function-call JSON for Gemini. The `execute` function is called
// automatically by the SDK inside the agentic loop.

export const agentTools = {
  sendEmail: tool({
    description:
      "Send an email to a recipient. Use this when the user asks to send, compose, or draft an email.",
    inputSchema: z.object({
      to: z.string().email().describe("Recipient email address"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body content (supports HTML)"),
    }),
    execute: async ({ to, subject, body }: { to: string; subject: string; body: string }) => {
      try {
        return await executeSendEmail(to, subject, body);
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  }),

  sendDiscord: tool({
    description:
      "Send a message to a Discord channel using a webhook URL. Use this when the user wants to post something to Discord.",
    inputSchema: z.object({
      webhookUrl: z.string().url().describe("Discord webhook URL"),
      content: z.string().describe("Message content to send"),
      username: z
        .string()
        .optional()
        .describe("Optional bot display name override"),
    }),
    execute: async ({ webhookUrl, content, username }) => {
      try {
        return await executeSendDiscord(webhookUrl, content, username);
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  }),

  sendTelegram: tool({
    description:
      "Send a message to a Telegram chat. Use this when the user asks to send a Telegram message.",
    inputSchema: z.object({
      chatId: z.string().describe("Telegram chat ID"),
      message: z.string().describe("Message text to send"),
    }),
    execute: async ({ chatId, message }) => {
      try {
        return await executeSendTelegram(chatId, message);
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  }),

  getCurrentTime: tool({
    description:
      "Get the current date and time in ISO format. Use this when the user asks about the current time or date.",
    inputSchema: z.object({}),
    execute: async () => {
      return {
        time: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    },
  }),

  calculateMath: tool({
    description:
      "Evaluate a mathematical expression and return the result. Use this for calculations, arithmetic, unit conversions, etc.",
    inputSchema: z.object({
      expression: z
        .string()
        .describe('Mathematical expression to evaluate, e.g. "2 * 3 + 10"'),
    }),
    execute: async ({ expression }) => {
      try {
        // Safe math evaluation (only allows numbers, operators, parens)
        const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "");
        if (sanitized !== expression) {
          return {
            success: false,
            error: "Expression contains invalid characters",
          };
        }
        const result = Function(`"use strict"; return (${sanitized})`)();
        return { expression, result, success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  }),
};
