import { Router } from "express";
import authMiddleware from "../middlewares/auth";
import { prismaClient } from "@repo/db";
import { nodeCreateSchema } from "../types/type";

const nodeRouter: Router = Router();

nodeRouter.post("/", authMiddleware, async (req, res) => {
  console.log("Create workflow request received", req.body);
  console.log("User from auth middleware:", req.user);

  const parsedData = nodeCreateSchema.safeParse(req.body);
  const id: string = req.user?.id;

  if (!parsedData.success) {
    return res.status(400).json({
      error: "Invalid request data",
      details: parsedData.error,
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

      // Create trigger node
      const trigger = await tx.triggerNodes.create({
        data: {
          TriggerNodeId: parsedData.data.availableTriggerId,
          workflowId: workflow.id,
          metadata: parsedData.data.triggerMeta,
        },
      });

      // Update workflow with trigger ID
      await tx.workFlow.update({
        where: {
          id: workflow.id,
        },
        data: {
          triggerId: trigger.id,
        },
      });

      return workflow.id;
    });

    return res.status(201).json({
      message: "Workflow created successfully",
      workflowId: workflowId,
    });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return res.status(500).json({ error: "Failed to create workflow" });
  }
});

nodeRouter.get("/", authMiddleware, async (req, res) => {
  const id: string = req.user?.id;
  try {
    const workFlows = await prismaClient.workFlow.findMany({
      where: {
        userId: id,
      },
      include: {
        actionsNodes: {
          include: {
            type: true,
          },
        },
        triggerNodes: {
          include: {
            type: true,
          },
        },
      },
    });
    console.log("workFlows handler");
    return res.json({
      workFlows,
    });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return res.status(500).json({ error: "Failed to fetch workflows" });
  }
});

nodeRouter.get("/:workFlowId", authMiddleware, async (req, res) => {
  const id: string = req.user?.id;
  const workFlowId = req.params.workFlowId;
  try {
    const workFlows = await prismaClient.workFlow.findMany({
      where: {
        id: workFlowId,
        userId: id,
      },
      include: {
        actionsNodes: {
          include: {
            type: true,
          },
        },
        triggerNodes: {
          include: {
            type: true,
          },
        },
      },
    });

    return res.json({
      workFlows,
    });
  } catch (error) {
    console.error("Error fetching workflow:", error);
    return res.status(500).json({ error: "Failed to fetch workflow" });
  }
});

nodeRouter.delete("/:workFlowId", authMiddleware, async (req, res) => {
  const id: string = req.user?.id;
  const workFlowId = req.params.workFlowId;
  try {
    // Verify the workflow belongs to this user
    const workflow = await prismaClient.workFlow.findFirst({
      where: { id: workFlowId, userId: id },
    });
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    // Delete related records then the workflow
    await prismaClient.$transaction(async (tx) => {
      await tx.actionNodes.deleteMany({ where: { workflowId: workFlowId } });
      await tx.triggerNodes.deleteMany({ where: { workflowId: workFlowId } });
      await tx.workFlowRun.deleteMany({ where: { workflowId: workFlowId } });
      await tx.workFlow.delete({ where: { id: workFlowId } });
    });

    return res.json({ message: "Workflow deleted successfully" });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return res.status(500).json({ error: "Failed to delete workflow" });
  }
});

nodeRouter.post("/:workFlowId/execute", authMiddleware, async (req, res) => {
  const id: string = req.user?.id;
  const workFlowId = req.params.workFlowId;
  try {
    const workflow = await prismaClient.workFlow.findFirst({
      where: { id: workFlowId, userId: id },
      include: {
        actionsNodes: { include: { type: true } },
        triggerNodes: { include: { type: true } },
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    // For now, acknowledge the execution request.
    // The actual execution is handled by the processor/worker services.
    return res.json({
      message: "Workflow execution triggered",
      workflowId: workFlowId,
    });
  } catch (error) {
    console.error("Error executing workflow:", error);
    return res.status(500).json({ error: "Failed to execute workflow" });
  }
});

export default nodeRouter;

