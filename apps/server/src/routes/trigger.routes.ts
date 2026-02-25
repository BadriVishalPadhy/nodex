import { Router } from "express";
import { prismaClient } from "@repo/db";

const triggerRouter: Router = Router();

triggerRouter.get("/", async (req, res) => {
  try {
    const triggers = await prismaClient.availableTriggerNodes.findMany();
    res.json({ value: triggers });
  } catch (error) {
    console.error("Error fetching triggers:", error);
    res.status(500).json({ error: "Failed to fetch triggers" });
  }
});

export default triggerRouter;
