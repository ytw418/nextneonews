import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client";

export * from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set (see .env.example)");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// Next.js 개발 서버의 HMR 때 커넥션이 쌓이지 않도록 전역에 하나만 둔다.
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
