import path from "node:path";

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// 환경변수는 레포 루트 .env 를 dotenv-cli 로 넘긴다 (package.json scripts 참고).
const repoRoot = path.resolve(process.cwd(), "../..");

// PostHog 프로젝트 'Hallyu Brief'(US 클라우드) 공개 토큰. 브라우저로 그대로 나가는 값이라 비밀이 아니다
const POSTHOG_KEY = "phc_B7fZuCH84TkLbfHoQtWDVPENv4hYv8DDVj6ScPXR5ebM";
// PostHog 요청을 우리 도메인으로 받아 넘기는 경로 (광고 차단기에 덜 막힌다). proxy.ts matcher 에서도 뺀다
const POSTHOG_RELAY = "/relay";

const nextConfig: NextConfig = {
  transpilePackages: ["@kmedia/core", "@kmedia/db"],
  // 운영 배포 빌드에만 토큰을 넣는다 (로컬·미리보기 배포는 집계하지 않는다). 쓰는 곳: src/instrumentation-client.ts
  env: {
    NEXT_PUBLIC_POSTHOG_KEY: process.env.VERCEL_ENV === "production" ? POSTHOG_KEY : "",
    NEXT_PUBLIC_POSTHOG_RELAY: POSTHOG_RELAY,
  },
  async rewrites() {
    return [
      { source: `${POSTHOG_RELAY}/static/:path*`, destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: `${POSTHOG_RELAY}/:path*`, destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  // PostHog API 주소는 끝이 / 로 끝난다(/e/ 등). 끝 / 를 떼는 이동을 하면 요청마다 한 번 더 오간다
  skipTrailingSlashRedirect: true,
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
