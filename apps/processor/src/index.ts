import { prismaClient } from "@repo/db";
import { Kafka } from "kafkajs";
import fs from "fs";
import path from "path";

const TOPIC_NAME = "OUTBOX";

async function main() {
  const brokerUrl = process.env.KAFKA_BROKER || "localhost:9092";
  const isAiven = brokerUrl.includes("aivencloud.com");

  const kafkaConfig: any = {
    clientId: "outbox-processor",
    brokers: [brokerUrl],
  };

  if (isAiven) {
    const certsPath =
      process.env.KAFKA_CERTS_PATH || path.join(__dirname, "..", "certs");

    // Extract hostname without port for TLS SNI
    const brokerHost = brokerUrl.split(":")[0];

    try {
      kafkaConfig.ssl = {
        rejectUnauthorized: true,
        ca: [fs.readFileSync(path.join(certsPath, "ca.pem"), "utf-8")],
        key: fs.readFileSync(path.join(certsPath, "service.key"), "utf-8"),
        cert: fs.readFileSync(path.join(certsPath, "service.cert"), "utf-8"),
        servername: brokerHost, // TLS cert validates against hostname, not IP
      };
    } catch (err: any) {
      console.error(`\n❌ [STARTUP ERROR]: Kafka certificates are missing in folder: ${certsPath}`);
      console.error(`   Aiven Kafka requires 'ca.pem', 'service.key', and 'service.cert' files.`);
      console.error(`   Please download these from your Aiven Console and place them in the 'certs' folder at the root of the project.`);
      console.error(`   Error details: ${err.message}\n`);
      process.exit(1);
    }

    // Aiven brokers advertise internal IPs in metadata responses.
    // Redirect all connections through the Aiven service URI instead.
    kafkaConfig.brokerAddressResolver = () => brokerUrl;
  }

  const kafka = new Kafka(kafkaConfig);

  // Ensure the topic exists before producing
  const admin = kafka.admin();
  await admin.connect();
  const topics = await admin.listTopics();
  if (!topics.includes(TOPIC_NAME)) {
    console.log(`Creating Kafka topic: ${TOPIC_NAME}`);
    await admin.createTopics({
      topics: [{ topic: TOPIC_NAME, numPartitions: 1, replicationFactor: 1 }],
    });
  }
  await admin.disconnect();

  const producer = kafka.producer();
  await producer.connect();
  console.log("✅ Processor connected to Kafka");

  while (true) {
    try {
      // Claim rows atomically: FOR UPDATE SKIP LOCKED prevents a second
      // processor instance from grabbing the same rows, and send+delete commit
      // in one transaction so a crash can't leave a sent-but-undeleted row.
      await prismaClient.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<{ id: string; WorkFlowRunId: string }[]>`
          SELECT id, "WorkFlowRunId" FROM "WorkFlowOutBox"
          ORDER BY id
          FOR UPDATE SKIP LOCKED
          LIMIT 10`;

        if (rows.length === 0) return;

        console.log(
          `Processing ${rows.length} pending rows: ${rows.map((r) => r.WorkFlowRunId).join(", ")}`,
        );

        await producer.send({
          topic: TOPIC_NAME,
          messages: rows.map((r) => ({
            value: JSON.stringify({ WorkFlowRunId: r.WorkFlowRunId, stage: 0 }),
          })),
        });

        await tx.workFlowOutBox.deleteMany({
          where: { id: { in: rows.map((r) => r.id) } },
        });

        console.log(`✅ Sent ${rows.length} run(s) to Kafka and cleared outbox rows`);
      });
    } catch (err) {
      console.error("❌ Processor loop error:", err);
    }

    await new Promise((r) => setTimeout(r, 3000));
  }
}

main().catch((err) => {
  console.error(
    "❌ [FATAL] Processor failed during startup, exiting for supervisor restart:",
    err,
  );
  process.exit(1);
});
