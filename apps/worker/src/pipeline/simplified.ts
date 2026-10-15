import * as OpenCC from "opencc-js";

import { prisma } from "@kmedia/db";

import { log } from "../log";

// 번체(대만) → 간체(본토). 글자뿐 아니라 대만식 단어도 본토식으로 바꾼다 (軟體→软件, 網路→网络). AI 호출 없음
const toCN = OpenCC.Converter({ from: "twp", to: "cn" });

export interface LocalizedText {
  title: string;
  seoTitle?: string;
  summary: string;
  keyPoints: string[];
  body: string;
  faq: { q: string; a: string }[];
}

export function toSimplified<T extends LocalizedText>(t: T): T {
  return {
    ...t,
    title: toCN(t.title),
    ...(t.seoTitle ? { seoTitle: toCN(t.seoTitle) } : {}),
    summary: toCN(t.summary),
    keyPoints: t.keyPoints.map(toCN),
    body: toCN(t.body),
    faq: t.faq.map((f) => ({ q: toCN(f.q), a: toCN(f.a) })),
  };
}

// 간체 번역이 없는 기존 글에 번체를 변환해 채운다
export async function backfillSimplified(): Promise<void> {
  const rows = await prisma.translation.findMany({
    where: { locale: "zh-TW", article: { translations: { none: { locale: "zh-CN" } } } },
  });
  for (const t of rows) {
    const cn = toSimplified({
      title: t.title,
      summary: t.summary,
      keyPoints: (t.keyPoints as string[] | null) ?? [],
      body: t.body,
      faq: (t.faq as { q: string; a: string }[] | null) ?? [],
    });
    await prisma.translation.create({ data: { articleId: t.articleId, locale: "zh-CN", slug: t.slug, ...cn } });
  }
  log.info("zh-CN: backfill done", { created: rows.length });
}
