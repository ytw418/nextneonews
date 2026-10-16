import path from "node:path";

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// 환경변수는 레포 루트 .env 를 dotenv-cli 로 넘긴다 (package.json scripts 참고).
const repoRoot = path.resolve(process.cwd(), "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@kmedia/core", "@kmedia/db"],
  devIndicators: false,
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
  // 위키미디어 사진은 표준 폭 썸네일로 받는다 (src/lib/image.ts). 폭 목록도 위키미디어 표준 폭 안에서만 고른다
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image.ts",
    deviceSizes: [330, 500, 960, 1280],
    imageSizes: [120, 250],
  },
  // 대문자 언어 주소(/EN) → 소문자 이동 규칙은 넣지 않는다: 버셀 라우팅이 대소문자를 구분하지 않고 비교해
  // /en 도 자기 자신으로 계속 보내는 무한 이동이 생겼다 (2026-10-16 운영 장애)
};

export default createNextIntlPlugin()(nextConfig);
