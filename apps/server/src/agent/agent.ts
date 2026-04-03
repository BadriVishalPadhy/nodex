import { generateText, stepCountIs, ModelMessage } from "ai";
import { google } from "@ai-sdk/google";
import { agentTools } from "./tools";

// ─── System Prompt ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an intelligent AI assistant integrated into a workflow automation platform called NodeX.

Your capabilities:
- Send emails via SendGrid (use the sendEmail tool)
- Send Discord messages via webhooks (use the sendDiscord tool)
- Send Telegram messages (use the sendTelegram tool)
- Get the current date/time (use the getCurrentTime tool)
- Perform calculations (use the calculateMath tool)

Guidelines:
1. Be helpful, concise, and professional.
2. Before executing any action (sending an email, Discord/Telegram message), ALWAYS confirm the details with the user first, unless they've explicitly provided all required information.
3. When a tool execution succeeds, report the result clearly.
4. When a tool execution fails, explain the error and suggest fixes.
5. You can chain multiple tool calls in a single response if needed.
6. Remember the conversation history — refer back to earlier messages when relevant.`;

// ─── Agent Runner ───────────────────────────────────────────────────
// Takes conversation history from the database and the new user message,
// runs the Vercel AI SDK agentic loop (up to 5 tool-call steps), and
// returns the final result.

export interface AgentResult {
  text: string;
  toolCalls: any[];
  steps: any[];
  responseMessages: any[];
}

export async function runAgent(
  conversationHistory: ModelMessage[],
  userMessage: string,
): Promise<AgentResult> {
  // Build the full message array: system → history → new user message
  const messages: ModelMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  const result = await generateText({
    model: google("gemini-2.0-flash"),
    messages,
    tools: agentTools,
    stopWhen: stepCountIs(5),
  });

  return {
    text: result.text,
    toolCalls: result.toolCalls ?? [],
    steps: result.steps ?? [],
    responseMessages: result.response.messages ?? [],
  };
}
