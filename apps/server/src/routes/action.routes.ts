import { prismaClient } from "@repo/db";
import { Router } from "express";

const actionRouter: Router = Router();

actionRouter.get("/", async (req, res) => {
  try {
    const availableActionNodes = await prismaClient.availableActionNodes.findMany({});
    res.json({ availableActionNodes });
  } catch (error) {
    console.error("Error fetching actions:", error);
    res.status(500).json({ error: "Failed to fetch actions" });
  }
});

export default actionRouter;
