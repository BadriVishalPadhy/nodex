import { Kafka } from "kafkajs";
import { prismaClient } from "@repo/db";
import { parse } from "./parse";
import { sendEmail } from "./email";
import { sendTelegram } from "./telegram";
import { sendDiscord } from "./discord";
import { executeAIAgent } from "./agent";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const TOPIC_NAME = "OUTBOX";
const DLQ_TOPIC = "OUTBOX_DLQ";
const MAX_RETRIES = 5;

async function main() {
  const brokerUrl = process.env.KAFKA_BROKER || "localhost:9092";
  const isAiven = brokerUrl.includes("aivencloud.com");

  const kafkaConfig: any = {
    clientId: "my-app",
    brokers: [brokerUrl],
  };

  if (isAiven) {
    const certsPath =
      process.env.KAFKA_CERTS_PATH || path.join(__dirname, "..", "certs");

    const brokerHost = brokerUrl.split(":")[0];

    try {
      kafkaConfig.ssl = {
        rejectUnauthorized: true,
        ca: [fs.readFileSync(path.join(certsPath, "ca.pem"), "utf-8")],
        key: fs.readFileSync(path.join(certsPath, "service.key"), "utf-8"),
        cert: fs.readFileSync(path.join(certsPath, "service.cert"), "utf-8"),
        servername: brokerHost,
      };
    } catch (err: any) {
      console.error(`\n❌ [STARTUP ERROR]: Kafka certificates are missing in folder: ${certsPath}`);
      console.error(`   Aiven Kafka requires 'ca.pem', 'service.key', and 'service.cert' files.`);
      console.error(`   Please download these from your Aiven Console and place them in the 'certs' folder at the root of the project.`);
      console.error(`   Error details: ${err.message}\n`);
      process.exit(1);
    }

    kafkaConfig.brokerAddressResolver = () => brokerUrl;
  }

  const kafka = new Kafka(kafkaConfig);

  // Ensure the topic exists before we try to produce/consume
  const admin = kafka.admin();
  await admin.connect();
  const topics = await admin.listTopics();
  const missingTopics = [TOPIC_NAME, DLQ_TOPIC].filter(
    (t) => !topics.includes(t),
  );
  if (missingTopics.length > 0) {
    console.log(`Creating Kafka topics: ${missingTopics.join(", ")}`);
    await admin.createTopics({
      topics: missingTopics.map((topic) => ({
        topic,
        numPartitions: 1,
        replicationFactor: 1,
      })),
    });
  }
  await admin.disconnect();

  const consumer = kafka.consumer({
    groupId: "worker-v3",
    sessionTimeout: 15000,
    heartbeatInterval: 5000,
  });

  await consumer.connect();
  const producer = kafka.producer();
  await producer.connect();
  console.log("✅ Worker connected to Kafka");

  await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: false });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const obj = JSON.parse(message.value?.toString()!);
        const workflowRunId = obj.WorkFlowRunId;
        const stage = obj.stage;

        console.log(
          `Processing: WorkflowRunId=${workflowRunId}, stage=${stage}`,
        );

        const availableActions = await prismaClient.workFlowRun.findFirst({
          where: { id: workflowRunId },
          include: {
            workflow: {
              include: {
                actionsNodes: {
                  include: { type: true },
                  orderBy: { sortingOrder: "asc" },
                },
              },
            },
          },
        });

        if (!availableActions?.workflow?.actionsNodes) {
          console.log(`No workflow/actions found for: ${workflowRunId}`);
          await consumer.commitOffsets([
            {
              topic: TOPIC_NAME,
              partition,
              offset: (parseInt(message.offset) + 1).toString(),
            },
          ]);
          return;
        }

        const currentAction = availableActions.workflow.actionsNodes.find(
          (x) => x.sortingOrder === stage,
        );

        if (!currentAction) {
          console.log("Current action not found");
          await consumer.commitOffsets([
            {
              topic: TOPIC_NAME,
              partition,
              offset: (parseInt(message.offset) + 1).toString(),
            },
          ]);
          return;
        }

        const workflowRunMetadata = availableActions.meta || {};
        console.log(`Executing stage ${stage}: ${currentAction.type.name}`);

        // Idempotency: Kafka is at-least-once and we re-queue on transient
        // errors, so a message can be redelivered after its action already
        // fired. Skip the side effect if this (run, stage) is already recorded.
        const already = await prismaClient.processedStage.findUnique({
          where: {
            workFlowRunId_stage: { workFlowRunId: workflowRunId, stage },
          },
        });

        if (already) {
          console.log(
            `↩️  Stage ${stage} for run ${workflowRunId} already processed — skipping side effect`,
          );
        } else {
          // ── Email (disabled — SendGrid sender not verified) ─────
          if (currentAction.type.id === "email") {
            const metadata = currentAction.metadata as any;
            const to = parse(metadata?.email || "", workflowRunMetadata);
            console.log(`⏭️  Skipping email to ${to} (SendGrid disabled)`);
          }

          // ── Telegram ─────────────────────────────────────────────
          if (currentAction.type.id === "telegram") {
            const metadata = currentAction.metadata as any;
            const chatId = parse(metadata?.chatId || "", workflowRunMetadata);
            const msg = parse(metadata?.message || "", workflowRunMetadata);
            console.log(`Sending Telegram to ${chatId}`);
            await sendTelegram(chatId, msg);
          }

          // ── Discord ──────────────────────────────────────────────
          if (currentAction.type.id === "discord") {
            const metadata = currentAction.metadata as any;
            const webhookUrl = parse(metadata?.webhookUrl || "", workflowRunMetadata);
            const content = parse(metadata?.content || "", workflowRunMetadata);
            const username = parse(metadata?.username || "", workflowRunMetadata);
            const avatarUrl = parse(metadata?.avatarUrl || "", workflowRunMetadata);
            console.log(`Sending Discord message`);
            await sendDiscord(webhookUrl, content, username || undefined, avatarUrl || undefined);
          }

          // ── AI Agent ──────────────────────────────────────────────
          if (currentAction.type.id === "ai-agent") {
            const metadata = currentAction.metadata as any;
            console.log(`Executing AI Agent`);

            // Build full workflow context for the agent — include all
            // sibling action nodes so the agent can see Telegram/Discord
            // configs and the user's message/task
            const allActions = availableActions.workflow.actionsNodes.map((a) => ({
              type: a.type.name,
              typeId: a.type.id,
              metadata: a.metadata,
              order: a.sortingOrder,
            }));

            const fullContext = {
              trigger: workflowRunMetadata,
              actions: allActions,
              currentTime: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
            };

            await executeAIAgent(
              metadata,
              fullContext as Record<string, any>,
              availableActions.workflow.userId,
            );
          }

          // Record completion right after the action so a redelivery or a
          // bounded retry won't run the side effect again. Duplicate next-stage
          // messages are harmless because each stage dedupes via its own marker.
          await prismaClient.processedStage
            .create({ data: { workFlowRunId: workflowRunId, stage } })
            .catch((e: any) => {
              if (e?.code === "P2002") return; // recorded concurrently — fine
              throw e;
            });
        }

        await new Promise((r) => setTimeout(r, 500));

        const lastStage =
          (availableActions.workflow.actionsNodes?.length || 1) - 1;

        if (lastStage !== stage) {
          await producer.send({
            topic: TOPIC_NAME,
            messages: [
              {
                value: JSON.stringify({
                  WorkFlowRunId: workflowRunId,
                  stage: stage + 1,
                }),
              },
            ],
          });
        }

        console.log("Processing done");
        await consumer.commitOffsets([
          {
            topic: TOPIC_NAME,
            partition,
            offset: (parseInt(message.offset) + 1).toString(),
          },
        ]);
      } catch (error) {
        console.error("Error processing message:", error);

        const commit = () =>
          consumer.commitOffsets([
            {
              topic: TOPIC_NAME,
              partition,
              offset: (parseInt(message.offset) + 1).toString(),
            },
          ]);

        // Recover the payload so we can bound retries instead of silently
        // dropping the message (previous behaviour committed the offset on any
        // error, permanently losing the workflow stage).
        let payload: any = null;
        try {
          payload = JSON.parse(message.value?.toString() ?? "");
        } catch {
          payload = null;
        }

        // Unparseable = poison message that can never succeed: route to the DLQ
        // and skip it so it doesn't block the partition.
        if (!payload || typeof payload !== "object") {
          console.error(
            `Poison message at offset ${message.offset} — sending to ${DLQ_TOPIC}`,
          );
          await producer.send({
            topic: DLQ_TOPIC,
            messages: [{ value: message.value ?? Buffer.from("null") }],
          });
          await commit();
          return;
        }

        const retries = (payload.retries ?? 0) + 1;
        if (retries <= MAX_RETRIES) {
          console.warn(
            `Re-queueing run ${payload.WorkFlowRunId} stage ${payload.stage} (retry ${retries}/${MAX_RETRIES})`,
          );
          await producer.send({
            topic: TOPIC_NAME,
            messages: [{ value: JSON.stringify({ ...payload, retries }) }],
          });
        } else {
          console.error(
            `Exhausted retries for run ${payload.WorkFlowRunId} stage ${payload.stage} — sending to ${DLQ_TOPIC}`,
          );
          await producer.send({
            topic: DLQ_TOPIC,
            messages: [
              {
                value: JSON.stringify({
                  ...payload,
                  failedAt: new Date().toISOString(),
                }),
              },
            ],
          });
        }
        await commit();
      }
    },
  });
}

// ── Scheduled-Message Polling Loop ──────────────────────────────────────────
// Runs independently of Kafka. Every 30 seconds, queries PostgreSQL for
// pending ScheduledMessages whose scheduledAt <= now(), sends them via the
// appropriate channel, and updates their status.

async function schedulerLoop() {
  console.log("⏰ Scheduler loop started — polling every 30s");

  while (true) {
    try {
      const dueMessages = await prismaClient.scheduledMessage.findMany({
        where: {
          status: "pending",
          scheduledAt: { lte: new Date() },
        },
        take: 20,
      });

      if (dueMessages.length > 0) {
        console.log(`⏰ Processing ${dueMessages.length} scheduled message(s)`);
      }

      for (const msg of dueMessages) {
        try {
          switch (msg.channel) {
            case "email":
              console.log(`⏭️  Skipping scheduled email to ${msg.recipient} (SendGrid disabled)`);
              break;
            case "telegram":
              await sendTelegram(msg.recipient, msg.message);
              break;
            case "discord":
              await sendDiscord(
                msg.recipient,
                msg.message,
                msg.username || undefined
              );
              break;
            default:
              throw new Error(`Unknown channel: ${msg.channel}`);
          }

          await prismaClient.scheduledMessage.update({
            where: { id: msg.id },
            data: { status: "sent", sentAt: new Date() },
          });
          console.log(`✅ Scheduled message ${msg.id} sent via ${msg.channel}`);
        } catch (err: any) {
          console.error(`❌ Failed to send scheduled message ${msg.id}:`, err.message);
          await prismaClient.scheduledMessage.update({
            where: { id: msg.id },
            data: { status: "failed", error: err.message },
          });
        }
      }
    } catch (err) {
      console.error("Scheduler loop error:", err);
    }

    await new Promise((r) => setTimeout(r, 30_000));
  }
}

// Global safety net: never let an unhandled rejection crash the process silently
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

// Start both the Kafka consumer and the scheduler loop in parallel. Exit
// non-zero on fatal startup errors so the supervisor (compose restart:always)
// can recover instead of leaving a hung process.
main().catch((err) => {
  console.error("Fatal: worker main() failed:", err);
  process.exit(1);
});
schedulerLoop().catch((err) => {
  console.error("Fatal: schedulerLoop() failed:", err);
  process.exit(1);
});
