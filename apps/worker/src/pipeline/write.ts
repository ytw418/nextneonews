import { randomBytes } from "node:crypto";

import { z } from "zod";

import { type Entity, prisma, type Topic } from "@kmedia/db";

import { BudgetExceededError } from "../ai/budget";
import { callStructured, RefusalError } from "../ai/client";
import { MODELS } from "../ai/models";
import { WRITE_SYSTEM } from "../ai/prompts";
import { attachImage } from "../entities/images";
import { findEntities } from "../entities/match";
import { log } from "../log";
import { stripHangulParens, unsupportedNumbers } from "./checks";
import { pickSentences } from "./extract";
import { toSimplified } from "./simplified";
import { fetchSourceMaterial, type SourceMaterial, SourceUnavailableError } from "./sources";

const Faq = z.object({ q: z.string(), a: z.string() });
const Localized = z.object({
  title: z.string(),
  seoTitle: z.string(),
  summary: z.string(),
  keyPoints: z.array(z.string()),
  body: z.string(),
  faq: z.array(Faq),
});
type Localized = z.infer<typeof Localized>;

// 한 번의 호출로 사실 목록 + 4개 언어 기사를 받는다 (예전: 작성 1회 + 번역 3회)
const Draft = z.object({
  facts: z.array(z.object({ id: z.string(), statement: z.string() })),
  slug: z.string(),
  seoDescription: z.string(),
  en: Localized,
  ja: Localized,
  zhTW: Localized,
  ko: Localized,
});

const autoPublish = process.env.AUTO_PUBLISH !== "false";

function kstToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function slugify(raw: string): string {
  const base = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 8)
    .join("-");
  return `${base || "article"}-${randomBytes(3).toString("hex")}`;
}

// 번역문에 남은 한글 괄호를 지운다 (ko 는 그대로)
function clean(t: Localized): Localized {
  return {
    title: stripHangulParens(t.title),
    seoTitle: stripHangulParens(t.seoTitle),
    summary: stripHangulParens(t.summary),
    keyPoints: t.keyPoints.map(stripHangulParens),
    body: stripHangulParens(t.body),
    faq: t.faq.map((f) => ({ q: stripHangulParens(f.q), a: stripHangulParens(f.a) })),
  };
}

function glossary(entities: Entity[]) {
  return entities.slice(0, 8).map((e) => ({ ko: e.ko, en: e.en, ja: e.ja, zhHant: e.zhHant }));
}

// 구조화 데이터(JSON-LD about)용 등장 인물: AI 대신 사전에서 만든다
function entityJson(entities: Entity[]) {
  const typeMap: Record<string, string> = { group: "MusicGroup", singer: "Person", actor: "Person", series: "TVSeries" };
  return entities.slice(0, 6).map((e) => ({
    name: e.en ?? e.ko ?? "",
    type: typeMap[e.type] ?? "Thing",
    koreanName: e.ko ?? "",
    alternateNames: [e.ja, e.zhHant].filter((n): n is string => Boolean(n)),
  }));
}

function writeRequest(topic: Topic, headline: string, source: SourceMaterial, entities: Entity[]): string {
  const names = entities.flatMap((e) => [e.ko, e.en]).filter((n): n is string => Boolean(n));
  // today 는 바뀌는 값이라 시스템 프롬프트(캐시)가 아니라 요청 본문에 넣는다
  return JSON.stringify({
    today: kstToday(),
    topic: { keyword: topic.keyword, category: topic.category, format: topic.format },
    glossary: glossary(entities),
    source: {
      headline,
      publisher: source.publisher,
      kind: source.kind,
      text: pickSentences(source.text, names),
      comments: source.comments,
    },
  });
}

async function writeTopic(topic: Topic): Promise<string> {
  const signal = await prisma.signal.findFirst({ where: { topicId: topic.id }, orderBy: { lastSeenAt: "desc" } });
  if (!signal) throw new Error(`topic ${topic.id} has no signal`);
  if (!topic.category || !topic.format) throw new Error(`topic ${topic.id} missing category/format`);

  const source = await fetchSourceMaterial(signal);
  const entities = await findEntities(`${signal.title} ${source.text.slice(0, 600)}`);
  const draft = await callStructured({
    task: "write",
    model: MODELS.write,
    system: WRITE_SYSTEM,
    user: writeRequest(topic, signal.title, source, entities),
    schema: Draft,
    effort: "low",
    maxTokens: 12000,
  });

  const en = clean(draft.en);
  const [year, month, day] = kstToday().split("-").map((part) => String(Number(part)));
  const warnings = unsupportedNumbers({ facts: draft.facts, ...en }, [year!, month!, day!]).map(
    (n) => `number-not-in-facts:${n}`,
  );

  const slug = slugify(draft.slug);
  const zhTW = clean(draft.zhTW);
  const locales: [string, Localized][] = [
    ["en", en],
    ["ja", clean(draft.ja)],
    ["zh-TW", zhTW],
    ["zh-CN", toSimplified(zhTW)], // 간체는 AI 대신 OpenCC 변환 (0원)
    ["ko", draft.ko],
  ];
  const article = await prisma.article.create({
    data: {
      topicId: topic.id,
      category: topic.category,
      format: topic.format,
      riskTier: topic.riskTier,
      // 케이아지트처럼 바로 발행한다. 사람 승인을 다시 켜려면 AUTO_PUBLISH=false → `worker publish`
      status: autoPublish ? "PUBLISHED" : "REVIEW",
      publishedAt: autoPublish ? new Date() : null,
      facts: { facts: draft.facts, warnings },
      entities: entityJson(entities),
      translations: {
        create: locales.map(([locale, t]) => ({
          locale,
          slug,
          title: t.title,
          seoTitle: t.seoTitle,
          summary: t.summary,
          keyPoints: t.keyPoints,
          body: t.body,
          faq: t.faq,
          ...(locale === "en" ? { seoDesc: draft.seoDescription } : {}),
        })),
      },
      sources: { create: [{ url: source.url, publisher: source.publisher, kind: source.kind }] },
    },
  });
  if (warnings.length > 0) log.warn("write: check warnings", { articleId: article.id, warnings });
  await attachImage(article.id);
  return article.id;
}

const CONCURRENCY = 4;

export async function writeArticles(limit = 3): Promise<{ written: string[]; skipped: number }> {
  const topics = await prisma.topic.findMany({
    where: { status: "QUEUED", riskTier: { not: "RED" } },
    orderBy: { score: "desc" },
    take: limit,
  });

  const written: string[] = [];
  let skipped = 0;
  // 4편씩 동시에 쓴다 (100편 기준 약 33분 → 8분)
  const queue = [...topics];
  const worker = async () => {
    for (let topic = queue.shift(); topic; topic = queue.shift()) {
      await writeOne(topic);
    }
  };
  const writeOne = async (topic: Topic) => {
    await prisma.topic.update({ where: { id: topic.id }, data: { status: "WRITING" } });
    try {
      const articleId = await writeTopic(topic);
      await prisma.topic.update({ where: { id: topic.id }, data: { status: "DONE" } });
      written.push(articleId);
      log.info("write: article created", { topic: topic.keyword, articleId });
    } catch (error) {
      if (error instanceof BudgetExceededError) {
        await prisma.topic.update({ where: { id: topic.id }, data: { status: "QUEUED" } });
        throw error;
      }
      skipped += 1;
      // 거절·원문 없음은 다시 시도해도 같으니 건너뛴다. 그 밖의 오류는 큐로 되돌린다.
      const permanent = error instanceof RefusalError || error instanceof SourceUnavailableError;
      await prisma.topic.update({ where: { id: topic.id }, data: { status: permanent ? "SKIPPED" : "QUEUED" } });
      log.error("write: failed", { topic: topic.keyword, error: String(error), permanent });
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, topics.length) }, worker));
  log.info("write: done", { written: written.length, skipped });
  return { written, skipped };
}
