import { cache } from "react";

import { prisma } from "@kmedia/db";

export async function listLatest(locale: string, take = 20) {
  return prisma.translation.findMany({
    where: { locale, article: { status: "PUBLISHED" } },
    orderBy: { article: { publishedAt: "desc" } },
    take,
    select: {
      slug: true,
      title: true,
      summary: true,
      article: { select: { category: true, publishedAt: true } },
    },
  });
}

// generateMetadata 와 페이지 본문이 같은 요청에서 한 번만 조회하도록 cache 로 감싼다.
export const getArticle = cache(async (locale: string, slug: string) => {
  return prisma.translation.findFirst({
    where: { locale, slug, article: { status: "PUBLISHED" } },
    include: {
      article: {
        include: {
          sources: true,
          translations: { select: { locale: true, slug: true } },
        },
      },
    },
  });
});

export async function listSitemapEntries() {
  return prisma.translation.findMany({
    where: { indexable: true, article: { status: "PUBLISHED" } },
    select: { locale: true, slug: true, article: { select: { updatedAt: true } } },
  });
}
