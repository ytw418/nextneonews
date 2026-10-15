import { prisma } from "@kmedia/db";

import { findEntities } from "../entities/match";
import { log } from "../log";
import { evaluate } from "./heuristics";

// 분류 규칙(heuristics.ts)을 바꾼 뒤 기존 글의 카테고리를 다시 매긴다 (AI 없음)
export async function recategorize(): Promise<void> {
  const articles = await prisma.article.findMany({
    where: { topicId: { not: null } },
    select: { id: true, category: true, topicId: true },
  });
  const changes: Record<string, number> = {};
  for (const a of articles) {
    const signal = await prisma.signal.findFirst({ where: { topicId: a.topicId! }, select: { title: true, source: true } });
    if (!signal) continue;
    const { category } = evaluate(signal, await findEntities(signal.title));
    if (category === a.category) continue;
    await prisma.article.update({ where: { id: a.id }, data: { category } });
    await prisma.topic.update({ where: { id: a.topicId! }, data: { category } });
    const key = `${a.category}→${category}`;
    changes[key] = (changes[key] ?? 0) + 1;
  }
  log.info("recategorize: done", changes);
}
