import { Router } from "express";
import authMiddleware from "../middlewares/auth";
import { prismaClient } from "@repo/db";
import { scheduleCreateSchema } from "../types/type";

const scheduleRouter: Router = Router();

// ────────────────────────────────────────────────────────────────────
// POST / — Create a scheduled message
// ────────────────────────────────────────────────────────────────────
scheduleRouter.post("/", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication Required!" });
  }

  const parsed = scheduleCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request data",
      details: parsed.error.flatten(),
    });
  }
  const { channel, recipient, message, subject, username, scheduledAt } =
    parsed.data;

  try {
    const scheduled = await prismaClient.scheduledMessage.create({
      data: {
        channel,
        recipient,
        message,
        subject: subject ?? null,
        username: username ?? null,
        scheduledAt,
        userId,
      },
    });

    return res.status(201).json({
      message: "Message scheduled successfully",
      scheduled,
    });
  } catch (error) {
    console.error("Error scheduling message:", error);
    return res.status(500).json({ error: "Failed to schedule message" });
  }
});

// ────────────────────────────────────────────────────────────────────
// GET / — List user's scheduled messages
// ────────────────────────────────────────────────────────────────────
scheduleRouter.get("/", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication Required!" });
  }

  try {
    const messages = await prismaClient.scheduledMessage.findMany({
      where: { userId },
      orderBy: { scheduledAt: "asc" },
    });

    return res.json({ messages });
  } catch (error) {
    console.error("Error fetching scheduled messages:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch scheduled messages" });
  }
});

// ────────────────────────────────────────────────────────────────────
// DELETE /:id — Cancel a pending scheduled message
// ────────────────────────────────────────────────────────────────────
scheduleRouter.delete("/:id", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication Required!" });
  }
  const messageId = req.params.id;

  try {
    // Atomic check-and-delete: the status="pending" + userId predicate is
    // evaluated as part of the delete, so the scheduler worker can't flip a
    // row to "sent" between a separate read and the delete (race / audit loss).
    const result = await prismaClient.scheduledMessage.deleteMany({
      where: { id: messageId, userId, status: "pending" },
    });

    if (result.count === 0) {
      return res.status(404).json({
        error: "Scheduled message not found or already sent",
      });
    }

    return res.json({ message: "Scheduled message cancelled" });
  } catch (error) {
    console.error("Error cancelling scheduled message:", error);
    return res
      .status(500)
      .json({ error: "Failed to cancel scheduled message" });
  }
});

export default scheduleRouter;
