import { PrismaClient } from "./generated/prisma/index.js";

export const prismaClient = new PrismaClient({
  log: ["error", "warn"],
});

// Eagerly connect and log errors
prismaClient
  .$connect()
  .then(() => console.log("✅ Database connected"))
  .catch((err: unknown) => console.error("❌ Database connection failed:", err));
