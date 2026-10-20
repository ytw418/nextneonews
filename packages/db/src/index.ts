import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client";
import { pgConnectionConfig } from "./tls";

export * from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// next build 는 CPU 수만큼 작업자를 띄워 정적 페이지를 동시에 그린다. 작업자마다 기본 풀(10개)을 열면
// 12코어 맥에서 110개가 되어 Postgres 한도(100)를 넘는다 → 빌드 중에만 작업자당 4개로 줄인다 (실행 중에는 기본값)
const BUILD_POOL_MAX = 4;

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set (see .env.example)");
  }
  const max = process.env.NEXT_PHASE === "phase-production-build" ? BUILD_POOL_MAX : undefined;
  return new PrismaClient({ adapter: new PrismaPg({ ...pgConnectionConfig(connectionString), max }) });
}

// Next.js 개발 서버의 HMR 때 커넥션이 쌓이지 않도록 전역에 하나만 둔다.
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
