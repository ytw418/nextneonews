import { cache } from "react";

import { type Category, type MediaKind, type Prisma, prisma } from "@kmedia/db";

// 화면에 대표 이미지로 쓸 수 있는 종류 (CARD·AI 는 커버를 따로 그린다)
const IMAGE_KINDS: MediaKind[] = ["EMBED", "AGENCY", "PRESS", "OWN", "STOCK"];

// 피드 카드에 필요한 것만: 제목·카테고리·발행일·대표 이미지(공식 이미지가 있을 때)
const feedSelect = {
  slug: true,
  title: true,
  summary: true,
  article: {
    select: {
      category: true,
      publishedAt: true,
      media: { where: { kind: { in: IMAGE_KINDS } }, select: { url: true }, take: 1 },
    },
  },
} satisfies Prisma.TranslationSelect;

export async function listLatest(locale: string, take = 30) {
  return prisma.translation.findMany({
    where: { locale, article: { status: "PUBLISHED" } },
    orderBy: { article: { publishedAt: "desc" } },
    take,
    select: feedSelect,
  });
}

export async function listByCategory(locale: string, category: Category, take = 30) {
  return prisma.translation.findMany({
    where: { locale, article: { status: "PUBLISHED", category } },
    orderBy: { article: { publishedAt: "desc" } },
    take,
    select: feedSelect,
  });
}

export async function listRelated(locale: string, excludeSlug: string, take = 6) {
  return prisma.translation.findMany({
    where: { locale, slug: { not: excludeSlug }, article: { status: "PUBLISHED" } },
    orderBy: { article: { publishedAt: "desc" } },
    take,
    select: feedSelect,
  });
}

export type FeedRow = Awaited<ReturnType<typeof listLatest>>[number];

// generateMetadata 와 페이지 본문이 같은 요청에서 한 번만 조회하도록 cache 로 감싼다.
export const getArticle = cache(async (locale: string, slug: string) => {
  return prisma.translation.findFirst({
    where: { locale, slug, article: { status: "PUBLISHED" } },
    include: {
      article: {
        include: {
          sources: true,
          media: { orderBy: { id: "asc" } },
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
