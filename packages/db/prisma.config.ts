import path from "node:path";

import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// 레포 루트의 .env 하나를 모든 앱이 같이 쓴다.
config({ path: path.resolve(import.meta.dirname, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
