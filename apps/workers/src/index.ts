import { Kafka } from "kafkajs";
import { prismaClient } from "@repo/db";
import { parse } from "./parse";
import { sendEmail } from "./email";
import { sendTelegram } from "./telegram";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const TOPIC_NAME = "OUTBOX";

const isAiven = (process.env.KAFKA_BROKER || "").includes("aivencloud.com");

const kafkaConfig: any = {
  clientId: "my-app",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
};

if (isAiven) {
  const certsPath =
    process.env.KAFKA_CERTS_PATH || path.join(__dirname, "..", "certs");
  kafkaConfig.ssl = {
    rejectUnauthorized: true,
    ca: [fs.readFileSync(path.join(certsPath, "ca.pem"), "utf-8")],
    key: fs.readFileSync(path.join(certsPath, "service.key"), "utf-8"),
    cert: fs.readFileSync(path.join(certsPath, "service.cert"), "utf-8"),
  };
}

const kafka = new Kafka(kafkaConfig);
const consumer = kafka.consumer({ groupId: "worker" });

async function main() {
  await consumer.connect();
  const producer = kafka.producer();
  await producer.connect();
  console.log("✅ Worker connected to Kafka");

  await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });

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

        // ── Email ────────────────────────────────────────────────
        if (currentAction.type.id === "email") {
          const metadata = currentAction.metadata as any;
          const body = parse(metadata?.body || "", workflowRunMetadata);
          const to = parse(metadata?.email || "", workflowRunMetadata);
          const subject = parse(metadata?.subject || "", workflowRunMetadata);
          console.log(`Sending email to ${to}`);
          await sendEmail(to, subject, body);
        }

        // ── Telegram ─────────────────────────────────────────────
        if (currentAction.type.id === "telegram") {
          const metadata = currentAction.metadata as any;
          const chatId = parse(metadata?.chatId || "", workflowRunMetadata);
          const msg = parse(metadata?.message || "", workflowRunMetadata);
          console.log(`Sending Telegram to ${chatId}`);
          await sendTelegram(chatId, msg);
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
        await consumer.commitOffsets([
          {
            topic: TOPIC_NAME,
            partition,
            offset: (parseInt(message.offset) + 1).toString(),
          },
        ]);
      }
    },
  });
}

main();
