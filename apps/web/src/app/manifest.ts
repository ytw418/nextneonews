import type { MetadataRoute } from "next";

import { SITE_NAME } from "@kmedia/core";

// 홈 화면에 설치(PWA). start_url "/" 은 브라우저 언어에 맞는 홈으로 넘어간다
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Hallyu",
    description: "What foreigners want to know about Korea, every day",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbf7f2",
    theme_color: "#fbf7f2",
    categories: ["news", "entertainment", "lifestyle"],
    icons: [
      { src: "/api/pwa-icon?size=192", sizes: "192x192", type: "image/png" },
      { src: "/api/pwa-icon?size=512", sizes: "512x512", type: "image/png" },
      { src: "/api/pwa-icon?size=512&maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
