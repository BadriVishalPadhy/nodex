import { Router } from "express";
import authMiddleware from "../middlewares/auth";
import { prismaClient } from "@repo/db";
import { runAgent } from "../agent/agent";
import { ModelMessage } from "ai";
import { z } from "zod/v4";

const agentRouter: Router = Router();

// ─── Validation Schemas ─────────────────────────────────────────────
const chatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  conversationId: z.string().uuid().optional(),
});

// ─── Helper: Convert DB messages → ModelMessage[] ────────────────────
function dbMessagesToCoreMessages(
  dbMessages: { role: string; content: any }[],
): ModelMessage[] {
  return dbMessages.map((msg) => {
    const role = msg.role;

    // If content is a plain string stored as JSON, unwrap it
    if (typeof msg.content === "string") {
      return { role, content: msg.content } as unknown as ModelMessage;
    }

    // Otherwise pass structured content through (tool calls, etc.)
    return { role, content: msg.content } as unknown as ModelMessage;
  });
}

// ────────────────────────────────────────────────────────────────────
// POST /chat — Send a message to the AI agent
// ────────────────────────────────────────────────────────────────────
agentRouter.post("/chat", authMiddleware, async (req, res) => {
  const userId: string = req.user?.id;

  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parsed.error.flatten(),
    });
  }

  const { message, conversationId } = parsed.data;

  try {
    let conversation;

    if (conversationId) {
      // ── Continue existing conversation ──
      conversation = await prismaClient.conversation.findFirst({
        where: { id: conversationId, userId },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
    } else {
      // ── Create a new conversation ──
      // Use the first ~50 chars of the message as the title
      const title =
        message.length > 50 ? message.substring(0, 50) + "..." : message;

      conversation = await prismaClient.conversation.create({
        data: { userId, title },
        include: { messages: true },
      });
    }

    // Load conversation history for the agent
    const history = dbMessagesToCoreMessages(conversation.messages);

    // Run the AI agent
    console.log(
      `[Agent] Running for conversation ${conversation.id}, history: ${history.length} messages`,
    );
    const result = await runAgent(history, message);
    console.log(
      `[Agent] Completed. Steps: ${result.steps.length}, Tool calls: ${result.toolCalls.length}`,
    );

    // ── Persist messages to DB ──
    // Save the user message
    await prismaClient.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    // Save the assistant response (including any tool call info in steps)
    const assistantContent: any = {
      text: result.text,
      toolCalls: result.toolCalls.map((tc: any) => ({
        toolName: tc.toolName,
        args: tc.args,
      })),
      steps: result.steps.map((step: any) => ({
        text: step.text,
        toolCalls: step.toolCalls?.map((tc: any) => ({
          toolName: tc.toolName,
          args: tc.args,
        })),
        toolResults: step.toolResults?.map((tr: any) => ({
          toolName: tr.toolName,
          result: tr.result,
        })),
      })),
    };

    await prismaClient.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: assistantContent,
      },
    });

    // Update conversation title if this is the first message
    if (conversation.messages.length === 0) {
      await prismaClient.conversation.update({
        where: { id: conversation.id },
        data: {
          title:
            message.length > 50 ? message.substring(0, 50) + "..." : message,
        },
      });
    }

    return res.json({
      conversationId: conversation.id,
      response: result.text,
      toolCalls: result.toolCalls.map((tc: any) => ({
        toolName: tc.toolName,
        args: tc.args,
      })),
      steps: result.steps.map((step: any) => ({
        text: step.text,
        toolCalls: step.toolCalls?.map((tc: any) => ({
          toolName: tc.toolName,
          args: tc.args,
        })),
        toolResults: step.toolResults?.map((tr: any) => ({
          toolName: tr.toolName,
          result: tr.result,
        })),
      })),
    });
  } catch (error: any) {
    console.error("[Agent] Error:", error);
    return res.status(500).json({
      error: "Agent execution failed",
      details: error.message,
    });
  }
});

// ────────────────────────────────────────────────────────────────────
// GET /conversations — List all conversations for the user
// ────────────────────────────────────────────────────────────────────
agentRouter.get("/conversations", authMiddleware, async (req, res) => {
  const userId: string = req.user?.id;

  try {
    const conversations = await prismaClient.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return res.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// ────────────────────────────────────────────────────────────────────
// GET /conversations/:id — Get full conversation with messages
// ────────────────────────────────────────────────────────────────────
agentRouter.get("/conversations/:id", authMiddleware, async (req, res) => {
  const userId: string = req.user?.id;
  const conversationId = req.params.id;

  try {
    const conversation = await prismaClient.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    return res.json({ conversation });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// ────────────────────────────────────────────────────────────────────
// DELETE /conversations/:id — Delete a conversation
// ────────────────────────────────────────────────────────────────────
agentRouter.delete("/conversations/:id", authMiddleware, async (req, res) => {
  const userId: string = req.user?.id;
  const conversationId = req.params.id;

  try {
    const conversation = await prismaClient.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Cascade delete will remove messages too (defined in schema)
    await prismaClient.conversation.delete({
      where: { id: conversationId },
    });

    return res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export default agentRouter;
