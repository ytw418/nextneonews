import path from "node:path";

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { guideNoindexHeaders } from "./src/lib/guide-seo";
import { DPR_CAP_WIDTHS } from "./src/lib/image";

// 환경변수는 레포 루트 .env 를 dotenv-cli 로 넘긴다 (package.json scripts 참고).
const repoRoot = path.resolve(process.cwd(), "../..");

// PostHog 요청을 우리 도메인으로 받아 넘기는 경로 (광고 차단기에 덜 막힌다). proxy.ts matcher 에서도 뺀다
const POSTHOG_RELAY = "/relay";

// 모든 응답에 붙이는 보안 헤더. Vercel 라우팅 단계에서 붙어 정적·ISR 캐시를 깨지 않는다 (함수 호출 없음).
// - 클릭재킹: 남의 사이트가 우리 화면(투표·제휴 링크)을 투명 iframe 에 넣지 못하게 frame-ancestors 만 둔다.
//   PostHog 앱의 히트맵·툴바는 사이트를 us.posthog.com iframe 에 띄우므로 연다. X-Frame-Options(SAMEORIGIN)는 그 화면을 막고,
//   frame-ancestors 를 아는 브라우저는 어차피 무시해서 넣지 않는다. 다른 CSP 지시어는 넣지 않는다(애드센스·쿠팡 iframe·GA 를 막지 않게)
// - Permissions-Policy: 쓰지 않는 기기 권한만 끈다. 애드센스가 쓰는 광고 API(attribution-reporting·browsing-topics 등)는 건드리지 않는다
// - Referrer-Policy: 브라우저 기본값과 같지만 점검 도구가 확인할 수 있게 적는다 (쿠팡 iframe 은 자기 referrerPolicy 를 쓴다)
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://us.posthog.com" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@kmedia/core", "@kmedia/db"],
  // 'X-Powered-By: Next.js' 를 내지 않는다
  poweredByHeader: false,
  // PostHog 토큰(Vercel 운영 환경변수, 프로젝트 'Hallyu Brief')은 운영 배포 빌드에만 넣는다 (로컬·미리보기는 집계하지 않는다).
  // 여기 env 가 NEXT_PUBLIC_* 자동 인라인보다 우선한다. 쓰는 곳: src/instrumentation-client.ts
  env: {
    NEXT_PUBLIC_POSTHOG_KEY: process.env.VERCEL_ENV === "production" ? (process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "") : "",
    NEXT_PUBLIC_POSTHOG_RELAY: POSTHOG_RELAY,
  },
  async rewrites() {
    return [
      { source: `${POSTHOG_RELAY}/static/:path*`, destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: `${POSTHOG_RELAY}/:path*`, destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  // 옛 주소(vercel.app)·www 로 오면 같은 경로의 unnienote.app 으로 영구 이동 (검색엔진이 색인·순위를 새 도메인으로 옮긴다).
  // proxy.ts 는 sitemap.xml·robots.txt 같은 파일을 matcher 에서 빼서, 모든 경로에 걸리는 여기서 한다
  async redirects() {
    return ["hallyu-brief.vercel.app", "www.unnienote.app"].map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://unnienote.app/:path*",
      // permanent(308) 이 아니라 301: 서치 콘솔 '주소 변경' 검사가 홈페이지 301 만 통과시킨다 (2026-10-19)
      statusCode: 301 as const,
    }));
  },
  // 가이드 섹션은 en·ja·zh-TW 만 검색에 내고, 치과·성형 시술은 모든 언어에서 noindex (목록은 src/lib/guide-seo.ts 한 곳)
  // 규칙이 여럿 맞으면 Next 가 헤더를 모두 붙인다 (보안 헤더 + 가이드 noindex)
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }, ...guideNoindexHeaders()];
  },
  // PostHog API 주소는 끝이 / 로 끝난다(/e/ 등). 끝 / 를 떼는 이동을 하면 요청마다 한 번 더 오간다
  skipTrailingSlashRedirect: true,
  devIndicators: false,
  turbopack: {
    root: repoRoot,
    // 줄바꿈 사전(budoux, 원본 380KB)은 서버에서만 쓴다. 브라우저 번들에는 분석기 없는 빈 모듈을 넣는다 (components/Phrase.tsx)
    resolveAlias: { budoux: { browser: "./src/lib/budoux-browser.ts" } },
  },
  outputFileTracingRoot: repoRoot,
  // 위키미디어 사진은 표준 폭 썸네일로 받는다 (src/lib/image.ts). 폭 목록은 위키미디어 표준 폭 + 3배 화면을 2배 남짓으로
  // 받게 하는 후보(DPR_CAP_WIDTHS, 로더가 표준 폭으로 내린다)
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image.ts",
    deviceSizes: [330, 500, 960, 1280, ...DPR_CAP_WIDTHS].sort((a, b) => a - b),
    imageSizes: [120, 250],
  },
  // 대문자 언어 주소(/EN) → 소문자 이동 규칙은 넣지 않는다: 버셀 라우팅이 대소문자를 구분하지 않고 비교해
  // /en 도 자기 자신으로 계속 보내는 무한 이동이 생겼다 (2026-10-16 운영 장애)
};

export default createNextIntlPlugin()(nextConfig);
