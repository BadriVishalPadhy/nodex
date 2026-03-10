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

    kafkaConfig.ssl = {
      rejectUnauthorized: true,
      ca: [fs.readFileSync(path.join(certsPath, "ca.pem"), "utf-8")],
      key: fs.readFileSync(path.join(certsPath, "service.key"), "utf-8"),
      cert: fs.readFileSync(path.join(certsPath, "service.cert"), "utf-8"),
      servername: brokerHost, // TLS cert validates against hostname, not IP
    };

    // Aiven brokers advertise internal IPs in metadata responses.
    // Redirect all connections through the Aiven service URI instead.
    kafkaConfig.brokerAddressResolver = () => brokerUrl;
  }

  const kafka = new Kafka(kafkaConfig);
  const producer = kafka.producer();
  await producer.connect();
  console.log("✅ Processor connected to Kafka");

  while (true) {
    const pendingRows = await prismaClient.workFlowOutBox.findMany({
      where: {},
      take: 10,
    });

    if (pendingRows.length > 0) {
      console.log(`Processing ${pendingRows.length} pending rows`);

      await producer.send({
        topic: TOPIC_NAME,
        messages: pendingRows.map((r) => ({
          value: JSON.stringify({ WorkFlowRunId: r.WorkFlowRunId, stage: 0 }),
        })),
      });

      await prismaClient.workFlowOutBox.deleteMany({
        where: {
          id: { in: pendingRows.map((x) => x.id) },
        },
      });
    }

    await new Promise((r) => setTimeout(r, 3000));
  }
}

main();
