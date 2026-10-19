import { prisma } from "@kmedia/db";

import { offTopicTerm } from "../collectors/policy";
import { log } from "../log";
import { announce } from "./announce";

// 발행된 글을 내린다 (상태 REJECTED — publish 는 REVIEW 만 올리므로 다시 발행되지 않는다).
// 인자는 글 id(cuid)·slug·slug 끝 6자리(예: 53e914) 아무거나. 번역은 모두 같은 slug 를 쓴다.
//   --off-topic  발행 글 중 영어·한국어 제목에 무관 주제 단어(collectors/policy.ts)가 있는 것을 찾는다
//   --dry        찾기만 하고 내리지 않는다
// 내린 뒤 사이트맵·언어 홈·피드·카테고리 캐시를 비우고, IndexNow 로 주소를 알려 검색엔진이 404 를 빨리 보게 한다
const CUID = /^c[a-z0-9]{20,}$/;
const SLUG_SUFFIX = /^[0-9a-f]{6}$/;

const select = {
  id: true,
  category: true,
  translations: { select: { locale: true, slug: true, title: true, indexable: true } },
} as const;

type Found = Awaited<ReturnType<typeof prisma.article.findMany<{ select: typeof select }>>>[number] & { reason: string };

async function byRefs(refs: string[]): Promise<Found[]> {
  const ids = refs.filter((r) => CUID.test(r));
  const suffixes = refs.filter((r) => SLUG_SUFFIX.test(r));
  const slugs = refs.filter((r) => !CUID.test(r) && !SLUG_SUFFIX.test(r));
  const rows = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { id: { in: ids } },
        { translations: { some: { slug: { in: slugs } } } },
        ...suffixes.map((s) => ({ translations: { some: { slug: { endsWith: `-${s}` } } } })),
      ],
    },
    select,
  });
  return rows.map((row) => ({ ...row, reason: "requested" }));
}

async function byOffTopic(): Promise<Found[]> {
  const rows = await prisma.article.findMany({ where: { status: "PUBLISHED" }, select });
  return rows.flatMap((row) => {
    const titles = row.translations.filter((t) => t.locale === "en" || t.locale === "ko").map((t) => t.title);
    const term = titles.map(offTopicTerm).find(Boolean);
    return term ? [{ ...row, reason: `off-topic:${term}` }] : [];
  });
}

export async function unpublish(args: string[]): Promise<void> {
  const dry = args.includes("--dry");
  const refs = args.filter((a) => !a.startsWith("--"));
  if (refs.length === 0 && !args.includes("--off-topic")) {
    log.error("usage: unpublish <id|slug|slug 끝 6자리…> [--dry] | unpublish --off-topic [--dry]");
    process.exitCode = 1;
    return;
  }

  const found = args.includes("--off-topic") ? await byOffTopic() : await byRefs(refs);
  for (const a of found) {
    const en = a.translations.find((t) => t.locale === "en") ?? a.translations[0];
    log.info(`${a.id} ${en?.slug ?? "(no translation)"}`, { reason: a.reason });
  }
  if (dry || found.length === 0) {
    log.info(`unpublish: ${found.length} article(s) ${dry ? "found (dry run)" : "found"}`);
    return;
  }

  await prisma.article.updateMany({ where: { id: { in: found.map((a) => a.id) } }, data: { status: "REJECTED" } });
  log.info(`unpublish: ${found.length} article(s) moved to REJECTED`);
  await announce(found.flatMap((a) => a.translations.map((t) => ({ ...t, category: a.category }))));
}
