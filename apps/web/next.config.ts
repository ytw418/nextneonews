import path from "node:path";

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// 환경변수는 레포 루트 .env 를 dotenv-cli 로 넘긴다 (package.json scripts 참고).
const repoRoot = path.resolve(process.cwd(), "../..");

// 주소 접두사 (packages/core LOCALE_PATH_PREFIX 와 같게). 설정 파일은 워크스페이스 TS 패키지를 불러오지 않아 따로 적는다
const LOCALE_PREFIXES = ["en", "ja", "zh-tw", "zh-cn", "ko", "vi", "id", "fr", "ru"];

// /EN·/zh-TW·/Ja 같은 대문자 주소를 소문자 주소로 영구 이동(308). 대소문자를 구분해 맞춰야
// 소문자 주소가 자기 자신으로 다시 보내지지 않는다 (experimental.caseSensitiveRoutes)
function upperCaseLocaleRedirects() {
  return LOCALE_PREFIXES.map((prefix) => {
    const variants = new Set([
      prefix.toUpperCase(), // EN, ZH-TW
      prefix.replace(/-(\w+)$/, (_, r: string) => `-${r.toUpperCase()}`), // zh-TW
      prefix[0].toUpperCase() + prefix.slice(1), // En, Zh-tw
    ]);
    variants.delete(prefix);
    return { source: `/:locale(${[...variants].join("|")})/:path*`, destination: `/${prefix}/:path*`, permanent: true };
  });
}

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
  experimental: { caseSensitiveRoutes: true },
  async redirects() {
    return upperCaseLocaleRedirects();
  },
};

export default createNextIntlPlugin()(nextConfig);
