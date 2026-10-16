import { CATEGORY_GROUPS } from "@kmedia/core";
import { type ArticleFormat, type Category, prisma } from "@kmedia/db";

import { log } from "../log";

// 색인 규칙 (docs/PRD.md 4.4). 1차 언어(en·ja·zh-TW)는 전부 색인한다.
// 그 밖의 언어는 현지 정보가 없는 자동 번역 연예 글을 noindex 로 둔다 — 구글 'scaled content abuse' 를 피하려고
const ALWAYS: readonly string[] = ["en", "ja", "zh-TW"];
const ENTERTAINMENT: readonly Category[] = CATEGORY_GROUPS.ENTERTAINMENT;
const EVERGREEN: readonly ArticleFormat[] = ["GUIDE", "QNA"];

export function isIndexable(locale: string, category: Category, format: ArticleFormat): boolean {
  return ALWAYS.includes(locale) || EVERGREEN.includes(format) || !ENTERTAINMENT.includes(category);
}

// 위 규칙을 기존 번역 전체에 다시 적용한다. 값이 바뀌는 행만 고치고 그 수를 출력한다
export async function fixIndexable(): Promise<void> {
  const others = { locale: { notIn: [...ALWAYS] } };
  const noindex = { format: { notIn: [...EVERGREEN] }, category: { in: [...ENTERTAINMENT] } };
  const [toNoindex, toIndex] = await prisma.$transaction([
    prisma.translation.updateMany({
      where: { ...others, indexable: true, article: noindex },
      data: { indexable: false },
    }),
    prisma.translation.updateMany({
      where: { indexable: false, OR: [{ locale: { in: [...ALWAYS] } }, { article: { NOT: noindex } }] },
      data: { indexable: true },
    }),
  ]);
  log.info("fix-indexable: done", { noindex: toNoindex.count, index: toIndex.count });
}
