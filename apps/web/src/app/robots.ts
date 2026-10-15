import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/url";

// AI 검색·답변용 크롤러/페처: 막으면 AI 답변에 인용될 수 없다 (docs/geo.md, 2026-10 공식 토큰 기준)
const AI_SEARCH_AGENTS = [
  "Googlebot", // AI Overviews·AI Mode 도 Googlebot 색인을 쓴다
  "Bingbot", // Copilot
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Agent",
  "meta-webindexer",
  "Applebot",
];

// 학습용: 브랜드가 모델 지식에 남도록 허용한다. 막고 싶으면 이 목록을 disallow 로 옮긴다
const AI_TRAINING_AGENTS = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "Meta-ExternalAgent"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: [...AI_SEARCH_AGENTS, ...AI_TRAINING_AGENTS], allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
