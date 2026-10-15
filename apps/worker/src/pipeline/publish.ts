import { articlePath } from "@kmedia/core";
import { prisma } from "@kmedia/db";

import { log } from "../log";
import { notifyIndexNow } from "./indexnow";

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
  const articles = await prisma.article.findMany({
    where: { status: "REVIEW", ...(ids.length > 0 ? { id: { in: ids } } : {}) },
    select: { id: true, translations: { select: { locale: true, slug: true } } },
  });
  if (articles.length === 0) {
    log.info("published 0 article(s)");
    return;
  }

  await prisma.article.updateMany({
    where: { id: { in: articles.map((a) => a.id) } },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  log.info(`published ${articles.length} article(s)`);

  const siteUrl = process.env.SITE_URL ?? "";
  const urls = articles.flatMap((a) => a.translations.map((t) => `${siteUrl}${articlePath(t.locale, t.slug)}`));
  await notifyIndexNow(urls);
}
