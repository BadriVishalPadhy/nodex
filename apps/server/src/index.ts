import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import nodeRouter from "./routes/node.routes";
import triggerRouter from "./routes/trigger.routes";
import actionRouter from "./routes/action.routes";
import heliusRouter from "./routes/helius.routes";
import agentRouter from "./routes/agent.routes";
import cors from "cors";

const PORT = 8000;
const app = express();

// Trust the first proxy (nginx) so Express sees the real protocol (HTTPS).
// Without this, secure cookies silently fail behind a reverse proxy.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://139.59.27.112:3000",
      "http://139.59.27.112",
      "http://nodex.codes:3000",
      "http://www.nodex.codes:3000",
      "http://nodex.codes",
      "http://www.nodex.codes",
      "https://nodex.codes",
      "https://www.nodex.codes",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/user", authRouter);
app.use("/api/v1/workflow", nodeRouter);
app.use("/api/v1/availableTrigger", triggerRouter);
app.use("/api/v1/availableActions", actionRouter);
app.use("/api/v1/helius", heliusRouter);
app.use("/api/v1/agent", agentRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Global error handler (must be after all routes)
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err.stack || err);
    res.status(500).json({ error: "Internal server error" });
  },
);

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});

