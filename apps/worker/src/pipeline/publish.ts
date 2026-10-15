import { prisma } from "@kmedia/db";

import { log } from "../log";

// 어드민 화면이 생기기 전까지 쓰는 CLI 승인 도구
export async function listReview(): Promise<void> {
  const articles = await prisma.article.findMany({
    where: { status: "REVIEW" },
    orderBy: { createdAt: "desc" },
    include: { translations: { where: { locale: "en" }, select: { title: true, slug: true } } },
  });
  for (const a of articles) {
    const facts = (a.facts ?? {}) as { warnings?: string[] };
    log.info(`${a.id} [${a.riskTier}] ${a.translations[0]?.title ?? "(no en)"}`, {
      slug: a.translations[0]?.slug,
      warnings: facts.warnings ?? [],
    });
  }
  log.info(`review: ${articles.length} article(s)`);
}

export async function publish(ids: string[]): Promise<void> {
  const where = ids.length > 0 ? { id: { in: ids }, status: "REVIEW" as const } : { status: "REVIEW" as const };
  const { count } = await prisma.article.updateMany({
    where,
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  log.info(`published ${count} article(s)`);
}
