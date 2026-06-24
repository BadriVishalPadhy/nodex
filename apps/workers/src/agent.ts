import Groq from "groq-sdk";
import { prismaClient } from "@repo/db";
import dotenv from "dotenv";
dotenv.config();

// Mask secret/PII-bearing recipients in logs (a Discord webhook URL is itself
// a credential that lets anyone post to the channel).
function maskRecipient(recipient?: string): string {
  if (!recipient) return "<none>";
  if (recipient.startsWith("https://discord.com/api/webhooks/")) {
    return "<discord-webhook redacted>";
  }
  return `***${recipient.slice(-4)}`;
}

type AllowedRecipients = {
  discord: Set<string>;
  telegram: Set<string>;
  email: Set<string>;
};

// ── Groq Client ────────────────────────────────────────────────────────────────

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// ── Tool Definitions (OpenAI-compatible function calling) ──────────────────────

const TOOLS: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "set_timer",
      description:
        "Schedule a message to be sent at a specific future time via email, telegram, or discord. " +
        "Use this when a user asks to set a timer, reminder, delay, or schedule something. " +
        "Convert natural language durations (e.g. '5 minutes', 'an hour', '30 seconds') into delay_seconds.",
      parameters: {
        type: "object",
        properties: {
          delay_seconds: {
            type: "number",
            description:
              "Number of seconds from now until the message should be sent. " +
              "Convert natural language: '5 minutes' = 300, '1 hour' = 3600, '30 seconds' = 30, etc.",
          },
          channel: {
            type: "string",
            enum: ["email", "telegram", "discord"],
            description: "The delivery channel for the scheduled message.",
          },
          recipient: {
            type: "string",
            description:
              "The recipient: email address for email, chat ID for telegram, webhook URL for discord.",
          },
          message: {
            type: "string",
            description: "The message body to send when the timer fires.",
          },
          label: {
            type: "string",
            description:
              "A short label/reason for this timer (e.g. 'Meeting reminder', 'Break time'). " +
              "Defaults to 'General Timer' if the user doesn't specify.",
          },
          subject: {
            type: "string",
            description:
              "Email subject line (only relevant when channel is 'email'). Defaults to the label.",
          },
        },
        required: ["delay_seconds", "channel", "recipient", "message"],
      },
    },
  },
];

// ── Tool Executor ──────────────────────────────────────────────────────────────

async function executeSetTimer(
  args: {
    delay_seconds: number;
    channel: string;
    recipient: string;
    message: string;
    label?: string;
    subject?: string;
  },
  ownerUserId: string,
  allowed: AllowedRecipients,
): Promise<string> {
  const {
    delay_seconds,
    channel,
    recipient,
    message,
    label = "General Timer",
    subject,
  } = args;

  // Only allow destinations already configured in this workflow's action
  // nodes. Without this the LLM could be coaxed (via trigger data / task
  // instructions) into relaying messages to arbitrary third-party endpoints.
  const allowList = allowed[channel as keyof AllowedRecipients];
  if (!allowList || !allowList.has(recipient)) {
    return JSON.stringify({
      success: false,
      error: `Recipient '${recipient}' for channel '${channel}' is not an authorized destination configured in this workflow.`,
    });
  }

  // Always persist to the DB; the scheduler loop delivers it. We never do an
  // inline active-wait — blocking eachMessage for tens of seconds would exceed
  // the Kafka session timeout and trigger a consumer rebalance.
  const scheduledAt = new Date(Date.now() + delay_seconds * 1000);

  const scheduled = await prismaClient.scheduledMessage.create({
    data: {
      channel,
      recipient,
      message,
      subject: subject || label,
      scheduledAt,
      userId: ownerUserId,
    },
  });

  const formattedTime = scheduledAt.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });

  return JSON.stringify({
    success: true,
    mode: "scheduled",
    scheduledMessageId: scheduled.id,
    scheduledAt: scheduledAt.toISOString(),
    formattedTime,
    message: `Timer set! Message will be sent via ${channel} to ${recipient} at ${formattedTime} (in ${delay_seconds}s).`,
    label,
  });
}

// ── Main Agent Execution Loop ──────────────────────────────────────────────────

export async function executeAIAgent(
  metadata: Record<string, any>,
  workflowRunMetadata: Record<string, any>,
  ownerUserId: string
): Promise<void> {
  // Build per-channel allow-lists from the workflow's configured action nodes,
  // so set_timer can only target destinations the workflow already owns.
  const actions: any[] = Array.isArray(workflowRunMetadata.actions)
    ? workflowRunMetadata.actions
    : [];
  const allowed: AllowedRecipients = {
    discord: new Set(
      actions.map((a) => a?.metadata?.webhookUrl).filter(Boolean)
    ),
    telegram: new Set(actions.map((a) => a?.metadata?.chatId).filter(Boolean)),
    email: new Set(actions.map((a) => a?.metadata?.email).filter(Boolean)),
  };

  const systemPrompt = metadata.systemPrompt || "You are a helpful assistant.";
  const model = metadata.model || "llama-3.3-70b-versatile";
  const maxSteps = parseInt(metadata.maxSteps || "6", 10);

  // Build the initial user message from workflow trigger metadata
  const triggerInfo = JSON.stringify(workflowRunMetadata, null, 2);
  const currentTime = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });

  const taskInstruction = metadata.taskInstruction 
    ? `\nIMPORTANT TASK INSTRUCTION FROM USER:\n${metadata.taskInstruction}\n`
    : "";

  const userMessage = `A workflow event was triggered. Current time: ${currentTime}
${taskInstruction}
Trigger data (full context):
${triggerInfo}

Process this event according to your instructions. If the user requested a timer or scheduled message in the task instruction above, use the set_timer tool.`;

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  console.log(`🤖 AI Agent starting — model: ${model}, maxSteps: ${maxSteps}`);

  for (let step = 0; step < maxSteps; step++) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 2048,
      });

      const choice = completion.choices[0];
      if (!choice) {
        console.log("🤖 Agent: No response from LLM");
        break;
      }

      const assistantMessage = choice.message;
      messages.push(assistantMessage);

      // If the model wants to call tools
      if (
        assistantMessage.tool_calls &&
        assistantMessage.tool_calls.length > 0
      ) {
        for (const toolCall of assistantMessage.tool_calls) {
          // Log only non-secret fields — never the raw recipient (webhook URL /
          // chatId / email) or the message body.
          let logArgs = "<unparseable args>";
          try {
            const a = JSON.parse(toolCall.function.arguments);
            logArgs = `channel=${a.channel} recipient=${maskRecipient(a.recipient)} delay_seconds=${a.delay_seconds} label=${a.label ?? ""}`;
          } catch {
            /* keep placeholder */
          }
          console.log(`🔧 Tool call: ${toolCall.function.name}(${logArgs})`);

          let result: string;

          try {
            if (toolCall.function.name === "set_timer") {
              const args = JSON.parse(toolCall.function.arguments);
              result = await executeSetTimer(args, ownerUserId, allowed);
            } else {
              result = JSON.stringify({
                error: `Unknown tool: ${toolCall.function.name}`,
              });
            }
          } catch (err: any) {
            result = JSON.stringify({
              error: `Tool execution failed: ${err.message}`,
            });
          }

          // Redact the result too — it echoes the recipient/message back.
          let logResult = result;
          try {
            const r = JSON.parse(result);
            logResult = JSON.stringify({
              success: r.success,
              mode: r.mode,
              scheduledMessageId: r.scheduledMessageId,
              error: r.error,
            });
          } catch {
            /* keep as-is */
          }
          console.log(`🔧 Tool result: ${logResult}`);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }
        // Continue the loop so the model can process tool results
        continue;
      }

      // No tool calls — the model is done or terminated abnormally. Every
      // finish_reason without tool_calls is terminal; never respin to maxSteps.
      if (choice.finish_reason === "length") {
        console.warn(
          `🤖 Agent truncated at step ${step + 1} (finish_reason=length, max_tokens=2048). ` +
            `Response/tool arguments may be incomplete: ${assistantMessage.content?.substring(0, 200)}`
        );
      } else if (choice.finish_reason === "stop") {
        console.log(
          `🤖 Agent finished (step ${step + 1}): ${assistantMessage.content?.substring(0, 200)}`
        );
      } else {
        console.warn(
          `🤖 Agent stopped at step ${step + 1} with finish_reason=${choice.finish_reason} and no tool calls.`
        );
      }
      break;
    } catch (err: any) {
      console.error(`🤖 Agent error at step ${step + 1}:`, err.message);
      break;
    }
  }

  console.log("🤖 AI Agent execution complete");
}
