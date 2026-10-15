import { readFileSync } from "node:fs";

import { type ArticleFormat, type Category, prisma } from "@kmedia/db";

import { log } from "../log";

// 가이드 주제 씨앗 (docs/research/topics-2026-10.md 우선순위 1). 커뮤니티에서 수요를 확인했고 공식 페이지로 답할 수 있는 것
interface GuideSeed {
  keyword: string;
  angle: string;
  category: Category;
  format: ArticleFormat;
  factUrls: string[];
  imageQuery?: string;
}

// 뉴스 주제(16~22점)보다 먼저 쓰이게 점수를 높게 둔다
const GUIDE_SCORE = 25;

export async function seedGuides(file = new URL("../../data/guides.json", import.meta.url)): Promise<void> {
  const seeds = JSON.parse(readFileSync(file, "utf8")) as GuideSeed[];
  let created = 0;
  for (const seed of seeds) {
    const exists = await prisma.topic.findFirst({ where: { keyword: seed.keyword }, select: { id: true } });
    if (exists) {
      // 이미 있는 주제는 사진 검색어만 맞춘다
      await prisma.topic.update({ where: { id: exists.id }, data: { imageQuery: seed.imageQuery ?? null } });
      continue;
    }
    await prisma.topic.create({
      data: {
        keyword: seed.keyword,
        angle: seed.angle,
        factUrls: seed.factUrls,
        imageQuery: seed.imageQuery ?? null,
        category: seed.category,
        format: seed.format,
        score: GUIDE_SCORE,
        riskTier: "GREEN",
        status: "QUEUED",
        locales: ["en", "ja", "zh-TW"],
        brief: "guide seed",
      },
    });
    created += 1;
  }
  log.info("guides: seeded", { created, total: seeds.length });
}
