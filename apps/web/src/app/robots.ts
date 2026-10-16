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

// /api 아래는 조회 수·댓글 같은 내부 호출이라 막는다. 공개 데이터인 랭킹 JSON, llms.txt 가 가리키는 일정 .ics,
// 구조화 데이터의 발행처 로고(512px)는 열어 둔다 (더 긴 allow 규칙이 이긴다)
const RULES = { allow: ["/", "/api/rankings/", "/api/calendar/", "/api/pwa-icon"], disallow: ["/api/"] };

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", ...RULES },
      // 이름을 따로 적은 봇은 * 묶음을 읽지 않으므로 같은 규칙을 한 번 더 적는다
      { userAgent: [...AI_SEARCH_AGENTS, ...AI_TRAINING_AGENTS], ...RULES },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
  };
}
