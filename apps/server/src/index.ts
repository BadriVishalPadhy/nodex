import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import nodeRouter from "./routes/node.routes";
import triggerRouter from "./routes/trigger.routes";
import actionRouter from "./routes/action.routes";
import scheduleRouter from "./routes/schedule.routes";


import cors from "cors";

const PORT = 8000;

// Fail fast on missing critical config rather than issuing/verifying
// tokens against an undefined secret on every request.
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
if (process.env.NODE_ENV !== "production") {
  console.warn(
    "NODE_ENV is not 'production'; auth cookies will be issued without Secure/SameSite=None",
  );
}

const app = express();

// Trust the first proxy (nginx) so Express sees the real protocol (HTTPS).
// Without this, secure cookies silently fail behind a reverse proxy.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
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
app.use("/api/v1/schedule", scheduleRouter);



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

