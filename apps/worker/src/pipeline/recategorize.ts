import { prisma } from "@kmedia/db";

import { findEntities } from "../entities/match";
import { log } from "../log";
import { evaluate } from "./heuristics";

// 분류 규칙(heuristics.ts)을 바꾼 뒤 기존 글의 카테고리·위험 등급을 다시 매긴다 (AI 없음)
export async function recategorize(): Promise<void> {
  const articles = await prisma.article.findMany({
    where: { topicId: { not: null } },
    select: { id: true, category: true, riskTier: true, topicId: true },
  });
  const changes: Record<string, number> = {};
  for (const a of articles) {
    const signal = await prisma.signal.findFirst({ where: { topicId: a.topicId! }, select: { title: true, source: true } });
    if (!signal) continue;
    const { category, risk } = evaluate(signal, await findEntities(signal.title));
    // 위험 단어를 늘리면 예전 글의 위험 등급도 다시 매긴다 (RED 는 사람이 정한 것이라 건드리지 않는다)
    const riskTier = a.riskTier === "RED" ? "RED" : risk;
    if (category === a.category && riskTier === a.riskTier) continue;
    await prisma.article.update({ where: { id: a.id }, data: { category, riskTier } });
    await prisma.topic.update({ where: { id: a.topicId! }, data: { category, riskTier } });
    const key = `${a.category}/${a.riskTier}→${category}/${riskTier}`;
    changes[key] = (changes[key] ?? 0) + 1;
  }
  log.info("recategorize: done", changes);
}
