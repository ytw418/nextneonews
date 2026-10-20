import { prisma } from "@kmedia/db";

import { BudgetExceededError } from "../ai/budget";
import { log } from "../log";
import { type AnnouncedPage, announce } from "./announce";
import { judgeTopic } from "./gate";

const CONCURRENCY = 4;

// 이미 발행한 뉴스 글을 작성 직전 판정(gate)으로 다시 본다: 한류·한국 생활과 무관하면 내리고(REJECTED),
// 분류가 틀렸으면 고친다. 가이드 글(공식 사실 목록으로 쓴 주제)은 사람이 고른 주제라 건너뛴다.
// 판정은 한국어판 제목·요약·본문 앞부분으로 한다. --dry 면 바꿀 것만 보여 준다
export async function regate(args: string[]): Promise<void> {
  const dry = args.includes("--dry");
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", topic: { factUrls: { isEmpty: true } } },
    select: {
      id: true,
      category: true,
      topicId: true,
      translations: { select: { locale: true, slug: true, title: true, summary: true, body: true, indexable: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  const rejected: string[] = [];
  const moved: { id: string; topicId: string | null; category: (typeof articles)[number]["category"] }[] = [];
  const queue = [...articles];
  const worker = async () => {
    for (let a = queue.shift(); a; a = queue.shift()) {
      const ko = a.translations.find((t) => t.locale === "ko") ?? a.translations[0];
      if (!ko) continue;
      const gate = await judgeTopic(ko.title, `${ko.summary}\n${ko.body}`);
      if (!gate.relevant) {
        rejected.push(a.id);
        log.info(`regate: off-topic ${ko.slug}`, { title: ko.title, reason: gate.reason });
      } else if (gate.category !== a.category) {
        moved.push({ id: a.id, topicId: a.topicId, category: gate.category });
        log.info(`regate: ${a.category} → ${gate.category} ${ko.slug}`, { title: ko.title });
      }
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, articles.length) }, worker));
  } catch (error) {
    if (!(error instanceof BudgetExceededError)) throw error;
    log.warn("regate: budget reached, applying what was judged so far");
  }
  log.info(`regate: ${articles.length} checked, ${rejected.length} off-topic, ${moved.length} recategorized${dry ? " (dry run)" : ""}`);
  if (dry) return;

  if (rejected.length > 0) {
    await prisma.article.updateMany({ where: { id: { in: rejected } }, data: { status: "REJECTED" } });
  }
  for (const m of moved) {
    await prisma.article.update({ where: { id: m.id }, data: { category: m.category } });
    if (m.topicId) await prisma.topic.update({ where: { id: m.topicId }, data: { category: m.category } });
  }
  // 내린 글·옮긴 글의 화면과 목록(홈·카테고리·피드·사이트맵)을 비운다. 옮긴 글은 옛 카테고리 목록도 비워야 해서 둘 다 알린다
  const changed = new Set([...rejected, ...moved.map((m) => m.id)]);
  const pages: AnnouncedPage[] = [];
  for (const a of articles) {
    if (!changed.has(a.id)) continue;
    const next = moved.find((m) => m.id === a.id)?.category;
    for (const t of a.translations) {
      pages.push({ locale: t.locale, slug: t.slug, category: a.category, indexable: false });
      if (next) pages.push({ locale: t.locale, slug: t.slug, category: next, indexable: t.indexable });
    }
  }
  await announce(pages);
}
