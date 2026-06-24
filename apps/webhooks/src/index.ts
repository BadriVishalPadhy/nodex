import express from "express";
import { prismaClient } from "@repo/db";
const app = express();
app.use(express.json());

const PORT = 4000;

/**
 * Flatten the incoming webhook payload into clean template variables.
 * Top-level keys are stringified so users can reference {key} in templates.
 */
function flattenWebhookMeta(body: any): Record<string, string> {
  const payload = Array.isArray(body) ? body[0] : body;

  // Always return a well-formed object — a falsy/non-object body (empty array,
  // missing Content-Type, etc.) must not leak a non-Record value into meta,
  // which the worker's parse() later indexes by key.
  if (!payload || typeof payload !== "object") return {};

  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    flat[key] = String(value);
  }
  return flat;
}

app.post("/hooks/catch/:userId/:workflow", async (req, res) => {
  const userId = req.params.userId;
  const workflowId = req.params.workflow;
  const body = req.body;

  // Flatten the payload into clean template variables
  const meta = flattenWebhookMeta(body);

  try {
    // Only trigger workflows that exist and belong to the user in the path —
    // otherwise anyone could fire arbitrary workflows by guessing an id, and an
    // invalid id would hit an unhandled FK violation.
    const workflow = await prismaClient.workFlow.findFirst({
      where: { id: workflowId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!workflow) {
      return res
        .status(404)
        .json({ success: false, message: "Workflow not found" });
    }

    await prismaClient.$transaction(async (tx: any) => {
      const run = await tx.workFlowRun.create({
        data: {
          workflowId: workflowId,
          meta: meta,
        },
      });

      await tx.workFlowOutBox.create({
        data: {
          WorkFlowRunId: run.id,
        },
      });
    });

    return res.json({
      success: true,
      message: "Webhook received and processed",
    });
  } catch (err: any) {
    console.error("Webhook processing failed", {
      userId,
      workflowId,
      error: err?.message,
    });
    return res
      .status(500)
      .json({ success: false, message: "Failed to process webhook" });
  }
});

app.listen(PORT, () => {
  console.log(` Hooks are running on PORT ${PORT} `);
});
