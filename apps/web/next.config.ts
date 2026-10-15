import path from "node:path";

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// 환경변수는 레포 루트 .env 를 dotenv-cli 로 넘긴다 (package.json scripts 참고).
const repoRoot = path.resolve(process.cwd(), "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@kmedia/core", "@kmedia/db"],
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
};

export default createNextIntlPlugin()(nextConfig);
