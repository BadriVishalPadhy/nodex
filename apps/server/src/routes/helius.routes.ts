import { Router } from "express";
import axios from "axios";
import authMiddleware from "../middlewares/auth";
import dotenv from "dotenv";

dotenv.config();

const heliusRouter: Router = Router();

const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const HOOKS_BASE_URL = process.env.HOOKS_BASE_URL!; // e.g. https://abc123.ngrok-free.app

// Register a Helius webhook for a specific workflow
heliusRouter.post("/register", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  const { workflowId, walletAddress } = req.body;

  if (!walletAddress || !workflowId) {
    return res
      .status(400)
      .json({ error: "walletAddress and workflowId are required" });
  }

  try {
    const webhookUrl = `${HOOKS_BASE_URL}/hooks/catch/${userId}/${workflowId}`;

    // Register with Helius API
    const response = await axios.post(
      `https://api.helius.xyz/v0/webhooks?api-key=${HELIUS_API_KEY}`,
      {
        webhookURL: webhookUrl,
        accountAddresses: [walletAddress],
        transactionTypes: ["ANY"], // Triggers on any transaction involving this wallet
        webhookType: "enhanced", // Rich parsed data
      },
    );

    return res.status(201).json({
      message: "Helius webhook registered successfully",
      heliusWebhookId: response.data.webhookID,
      webhookUrl,
    });
  } catch (error: any) {
    console.error(
      "Helius webhook registration failed:",
      error.response?.data || error.message,
    );
    return res.status(500).json({ error: "Failed to register Helius webhook" });
  }
});

export default heliusRouter;
