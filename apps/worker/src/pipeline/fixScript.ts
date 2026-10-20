import { prisma } from "@kmedia/db";

import { log } from "../log";
import { announce } from "./announce";
import { kanaNames, replaceKana } from "./checks";
import { toCN } from "./simplified";

// 이미 저장된 글에서 다른 언어 글자(일본어판이 아닌 글의 가나, "イム・シワン")를 사전 표기로 바꾼다. AI 를 부르지 않는다.
// 사전에 없는 가나는 그대로 두고 목록만 남긴다. 사전 일본어 표기가 한자(任時完)라 가타카나와 이어지지 않는 이름은
// `イム・シワン=任時完` 처럼 짝을 직접 준다 (간체판은 자동으로 간체로 바꿔 쓴다). --dry 면 바꿀 것만 보여 준다.
// 고친 글은 사이트 캐시를 비워 바로 새 판이 보이게 한다 (웹 화면은 시간이 지나도 다시 만들지 않는다)
export async function fixScript(args: string[]): Promise<void> {
  const dry = args.includes("--dry");
  // 짝은 인자로도, Actions 입력(FIX_SCRIPT_NAMES, 공백 구분)으로도 받는다
  const pairs = [...args, ...(process.env.FIX_SCRIPT_NAMES ?? "").split(/\s+/)].filter((a) => a.includes("="));
  const extra = pairs.map((a) => a.split("=") as [string, string]);
  const ids = await prisma.$queryRaw<{ id: string }[]>`
    SELECT t.id FROM "Translation" t
    WHERE t.locale <> 'ja'
      AND (t.title ~ '[ぁ-ゖァ-ヺ]' OR t.summary ~ '[ぁ-ゖァ-ヺ]' OR t.body ~ '[ぁ-ゖァ-ヺ]'
        OR t."keyPoints"::text ~ '[ぁ-ゖァ-ヺ]' OR t.faq::text ~ '[ぁ-ゖァ-ヺ]'
        OR coalesce(t."seoTitle", '') ~ '[ぁ-ゖァ-ヺ]' OR coalesce(t.poll::text, '') ~ '[ぁ-ゖァ-ヺ]'
        OR coalesce(t.netizen::text, '') ~ '[ぁ-ゖァ-ヺ]')`;
  if (ids.length === 0) {
    log.info("fix-script: nothing to fix");
    return;
  }
  const rows = await prisma.translation.findMany({
    where: { id: { in: ids.map((r) => r.id) } },
    include: { article: { select: { category: true, status: true } } },
  });
  const entities = await prisma.entity.findMany({
    where: { ja: { not: null } },
    select: { ja: true, ko: true, en: true, zhHant: true },
  });
  const fixed: { locale: string; slug: string; category: (typeof rows)[number]["article"]["category"]; indexable: boolean }[] = [];
  for (const t of rows) {
    // 간체는 번체 사전 표기를 간체로 바꿔 쓴다
    const names = kanaNames(entities, t.locale === "zh-CN" ? "zh-TW" : t.locale);
    for (const [ja, target] of extra) names.set(ja.replace(/[・\s]/g, ""), target);
    if (t.locale === "zh-CN") for (const [k, v] of names) names.set(k, toCN(v));
    const fields = {
      title: t.title,
      seoTitle: t.seoTitle,
      summary: t.summary,
      keyPoints: t.keyPoints,
      body: t.body,
      faq: t.faq,
      poll: t.poll,
      netizen: t.netizen,
    };
    const { value, left } = replaceKana(fields, names);
    const changed = JSON.stringify(value) !== JSON.stringify(fields);
    log.info(`fix-script: ${t.locale} ${t.slug}`, { changed, left, title: value.title });
    if (!changed || dry) continue;
    await prisma.translation.update({
      where: { id: t.id },
      data: {
        title: value.title,
        seoTitle: value.seoTitle,
        summary: value.summary,
        keyPoints: value.keyPoints ?? undefined,
        body: value.body,
        faq: value.faq ?? undefined,
        poll: value.poll ?? undefined,
        netizen: value.netizen ?? undefined,
      },
    });
    if (t.article.status === "PUBLISHED") {
      fixed.push({ locale: t.locale, slug: t.slug, category: t.article.category, indexable: t.indexable });
    }
  }
  log.info(`fix-script: ${rows.length} translation(s) with kana, ${fixed.length} fixed${dry ? " (dry run)" : ""}`);
  await announce(fixed);
}
