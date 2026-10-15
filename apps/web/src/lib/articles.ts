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

function entityNames(entities: unknown): string[] {
  if (!Array.isArray(entities)) return [];
  return entities
    .map((e) => (e && typeof e === "object" && "name" in e ? String((e as { name: unknown }).name) : ""))
    .filter(Boolean);
}

const DAY_MS = 86_400_000;

// 관련 글: 같은 인물·그룹·작품이 나오는 글을 가장 높게, 그다음 같은 카테고리. 최근 글과 많이 본 글에 조금 더 준다
export async function listRelated(
  locale: string,
  current: { id: string; category: Category; entities: unknown },
  take = 6,
) {
  const names = entityNames(current.entities).slice(0, 4);
  const rows = await prisma.translation.findMany({
    where: {
      locale,
      articleId: { not: current.id },
      article: {
        status: "PUBLISHED",
        OR: [{ category: current.category }, ...names.map((name) => ({ entities: { array_contains: [{ name }] } }))],
      },
    },
    orderBy: { article: { publishedAt: "desc" } },
    take: 40,
    select: {
      ...feedSelect,
      article: { select: { ...feedSelect.article.select, entities: true, views: true } },
    },
  });
  const now = Date.now();
  const score = (row: (typeof rows)[number]) => {
    const theirs = new Set(entityNames(row.article.entities));
    const shared = names.filter((n) => theirs.has(n)).length;
    const ageDays = row.article.publishedAt ? (now - row.article.publishedAt.getTime()) / DAY_MS : 30;
    return shared * 3 + (row.article.category === current.category ? 1 : 0) + Math.max(0, 1 - ageDays / 7) + Math.min(1, row.article.views / 200);
  };
  return rows
    .map((row) => ({ row, s: score(row) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, take)
    .map(({ row }) => row);
}

// 인기 글: 최근 N일 안에 나온 글 중 많이 본 순 (조회 수가 같으면 최신순)
export async function listPopular(locale: string, take = 8, days = 7) {
  return prisma.translation.findMany({
    where: { locale, article: { status: "PUBLISHED", publishedAt: { gte: new Date(Date.now() - days * DAY_MS) } } },
    orderBy: [{ article: { views: "desc" } }, { article: { publishedAt: "desc" } }],
    take,
    select: feedSelect,
  });
}

// 번역이 아직 없는 언어 주소로 들어오면 있는 언어로 보낸다 (영어 우선)
export async function findTranslatedLocale(slug: string): Promise<string | null> {
  const rows = await prisma.translation.findMany({
    where: { slug, article: { status: "PUBLISHED" } },
    select: { locale: true },
  });
  const locales = rows.map((r) => r.locale);
  return locales.includes("en") ? "en" : (locales[0] ?? null);
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
    select: {
      locale: true,
      slug: true,
      articleId: true,
      article: { select: { updatedAt: true, media: { select: { url: true }, take: 1 } } },
    },
  });
}
