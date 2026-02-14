import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import nodeRouter from "./routes/node.routes";
import triggerRouter from "./routes/trigger.routes";
import actionRouter from "./routes/action.routes";
import heliusRouter from "./routes/helius.routes";
import cors from "cors";

const PORT = 8000;
const app = express();
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

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
