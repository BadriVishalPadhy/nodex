import { Router } from "express";
import authMiddleware from "../middlewares/auth";
import { prismaClient } from "@repo/db";
import { nodeCreateSchema, workflowUpdateSchema } from "../types/type";

const nodeRouter: Router = Router();

// ─── Reusable scope: only non-deleted workflows owned by the user ───
const activeWorkflowScope = (userId: string, workflowId?: string) => ({
  ...(workflowId && { id: workflowId }),
  userId,
  deletedAt: null,
});

// ─── Reusable include for full workflow hydration ───
const fullWorkflowInclude = {
  actionsNodes: { include: { type: true }, orderBy: { sortingOrder: "asc" as const } },
  triggerNodes: { include: { type: true } },
};

// ────────────────────────────────────────────────────────────────────
// POST / — Create workflow
// ────────────────────────────────────────────────────────────────────
nodeRouter.post("/", authMiddleware, async (req, res) => {
  const parsedData = nodeCreateSchema.safeParse(req.body);
  const id: string = req.user?.id;

  if (!parsedData.success) {
    return res.status(400).json({
      error: "Invalid request data",
      details: parsedData.error.flatten(),
    });
  }

  try {
    const workflowId = await prismaClient.$transaction(async (tx) => {
      const workflow = await tx.workFlow.create({
        data: {
          userId: id,
          triggerId: "",
          actionsNodes: {
            create: parsedData.data.actions.map((action, index) => ({
              ActionNodeId: action.availableActionId,
              sortingOrder: index,
              metadata: action.actionMeta,
            })),
          },
        },
      });

      const trigger = await tx.triggerNodes.create({
        data: {
          TriggerNodeId: parsedData.data.availableTriggerId,
          workflowId: workflow.id,
          metadata: parsedData.data.triggerMeta,
        },
      });

      await tx.workFlow.update({
        where: { id: workflow.id },
        data: { triggerId: trigger.id },
      });

      return workflow.id;
    });

    return res.status(201).json({
      message: "Workflow created successfully",
      workflowId,
    });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return res.status(500).json({ error: "Failed to create workflow" });
  }
});

// ────────────────────────────────────────────────────────────────────
// GET / — List all active workflows for the user
// ────────────────────────────────────────────────────────────────────
nodeRouter.get("/", authMiddleware, async (req, res) => {
  const id: string = req.user?.id;
  try {
    const workFlows = await prismaClient.workFlow.findMany({
      where: activeWorkflowScope(id),
      include: fullWorkflowInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.json({ workFlows });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return res.status(500).json({ error: "Failed to fetch workflows" });
  }
});

// ────────────────────────────────────────────────────────────────────
// GET /:workFlowId — Get a single active workflow
// ────────────────────────────────────────────────────────────────────
nodeRouter.get("/:workFlowId", authMiddleware, async (req, res) => {
  const id: string = req.user?.id;
  const workFlowId = req.params.workFlowId;

  try {
    const workflow = await prismaClient.workFlow.findFirst({
      where: activeWorkflowScope(id, workFlowId),
      include: fullWorkflowInclude,
    });

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    return res.json({ workflow });
  } catch (error) {
    console.error("Error fetching workflow:", error);
    return res.status(500).json({ error: "Failed to fetch workflow" });
  }
});

// ────────────────────────────────────────────────────────────────────
// PUT /:workFlowId — Edit workflow (name, nodes, edges, metadata)
// ────────────────────────────────────────────────────────────────────
nodeRouter.put("/:workFlowId", authMiddleware, async (req, res) => {
  const userId: string = req.user?.id;
  const workFlowId = req.params.workFlowId as string;

  const parsedData = workflowUpdateSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({
      error: "Invalid request data",
      details: parsedData.error.flatten(),
    });
  }

  const { name, availableTriggerId, triggerMeta, actions, metadata } =
    parsedData.data;

  try {
    const existing = await prismaClient.workFlow.findFirst({
      where: activeWorkflowScope(userId, workFlowId),
      include: { triggerNodes: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    const updatedWorkflow = await prismaClient.$transaction(async (tx) => {
      // 1. Update workflow scalar fields (name, metadata)
      const workflowUpdateData: Record<string, unknown> = {};
      if (name !== undefined) workflowUpdateData.name = name;
      if (metadata !== undefined) workflowUpdateData.metadata = metadata;

      // Always touch updatedAt (Prisma @updatedAt handles this automatically,
      // but an explicit set guarantees it even when no scalar changes)
      await tx.workFlow.update({
        where: { id: workFlowId },
        data: workflowUpdateData,
      });

      // 2. Replace trigger if a new triggerId or triggerMeta is provided
      if (availableTriggerId !== undefined || triggerMeta !== undefined) {
        if (existing.triggerNodes) {
          await tx.triggerNodes.update({
            where: { id: existing.triggerNodes.id },
            data: {
              ...(availableTriggerId !== undefined && {
                TriggerNodeId: availableTriggerId,
              }),
              ...(triggerMeta !== undefined && { metadata: triggerMeta }),
            },
          });
        } else if (availableTriggerId) {
          // No trigger existed – create one
          const trigger = await tx.triggerNodes.create({
            data: {
              TriggerNodeId: availableTriggerId,
              workflowId: workFlowId,
              metadata: triggerMeta ?? {},
            },
          });
          await tx.workFlow.update({
            where: { id: workFlowId },
            data: { triggerId: trigger.id },
          });
        }
      }

      // 3. Replace action nodes if provided (delete-all → re-create)
      if (actions !== undefined) {
        await tx.actionNodes.deleteMany({ where: { workflowId: workFlowId } });

        if (actions.length > 0) {
          await tx.actionNodes.createMany({
            data: actions.map((action, index) => ({
              workflowId: workFlowId,
              ActionNodeId: action.availableActionId,
              sortingOrder: action.sortingOrder ?? index,
              metadata: action.actionMeta ?? {},
            })),
          });
        }
      }

      // 4. Return the fully hydrated workflow
      return tx.workFlow.findUnique({
        where: { id: workFlowId },
        include: fullWorkflowInclude,
      });
    });

    return res.json({
      message: "Workflow updated successfully",
      workflow: updatedWorkflow,
    });
  } catch (error) {
    console.error("Error updating workflow:", error);
    return res.status(500).json({ error: "Failed to update workflow" });
  }
});

// ────────────────────────────────────────────────────────────────────
// DELETE /:workFlowId — Soft-delete workflow
// ────────────────────────────────────────────────────────────────────
nodeRouter.delete("/:workFlowId", authMiddleware, async (req, res) => {
  const id: string = req.user?.id;
  const workFlowId = req.params.workFlowId;

  try {
    const workflow = await prismaClient.workFlow.findFirst({
      where: activeWorkflowScope(id, workFlowId),
    });

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    // Soft delete — set deletedAt timestamp; data is preserved
    await prismaClient.workFlow.update({
      where: { id: workFlowId },
      data: { deletedAt: new Date() },
    });

    return res.json({ message: "Workflow deleted successfully" });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return res.status(500).json({ error: "Failed to delete workflow" });
  }
});

// ────────────────────────────────────────────────────────────────────
// POST /:workFlowId/execute — Trigger manual execution
// ────────────────────────────────────────────────────────────────────
nodeRouter.post("/:workFlowId/execute", authMiddleware, async (req, res) => {
  const id: string = req.user?.id;
  const workFlowId = req.params.workFlowId;

  try {
    const workflow = await prismaClient.workFlow.findFirst({
      where: activeWorkflowScope(id, workFlowId),
      include: fullWorkflowInclude,
    });

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    const run = await prismaClient.$transaction(async (tx) => {
      const r = await tx.workFlowRun.create({
        data: {
          workflowId: workFlowId as string,
          meta: {
            trigger: "manual",
            timestamp: new Date().toISOString(),
          },
        },
      });

      await tx.workFlowOutBox.create({
        data: { WorkFlowRunId: r.id },
      });

      return r;
    });

    return res.json({
      message: "Workflow execution triggered",
      workflowId: workFlowId,
      runId: run.id,
    });
  } catch (error) {
    console.error("Error executing workflow:", error);
    return res.status(500).json({ error: "Failed to execute workflow" });
  }
});

export default nodeRouter;
