import type { MetadataRoute } from "next";

import { SITE_NAME } from "@kmedia/core";

// 아이콘 그림 버전. api/pwa-icon 은 7일 immutable 캐시라 그림을 바꾸면 올려서 옛 'H.' 아이콘을 버리게 한다
const ICON_VERSION = 2;

// 홈 화면에 설치(PWA). start_url "/" 은 브라우저 언어에 맞는 홈으로 넘어간다
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Unnie Note",
    description: "What foreigners want to know about Korea, every day",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["news", "entertainment", "lifestyle"],
    icons: [
      { src: `/api/pwa-icon?size=192&v=${ICON_VERSION}`, sizes: "192x192", type: "image/png" },
      { src: `/api/pwa-icon?size=512&v=${ICON_VERSION}`, sizes: "512x512", type: "image/png" },
      {
        src: `/api/pwa-icon?size=512&maskable=1&v=${ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
