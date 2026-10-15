import { randomBytes } from "node:crypto";

import { z } from "zod";

import { prisma, type Topic } from "@kmedia/db";

import { BudgetExceededError } from "../ai/budget";
import { callStructured, RefusalError } from "../ai/client";
import { MODELS } from "../ai/models";
import { LOCALIZE_SYSTEM, WRITE_SYSTEM } from "../ai/prompts";
import { attachImage } from "../entities/images";
import { log } from "../log";
import { stripHangulParens, unsupportedNumbers } from "./checks";
import { fetchSourceMaterial, type SourceMaterial, SourceUnavailableError } from "./sources";

const Faq = z.object({ q: z.string(), a: z.string() });

const Entity = z.object({
  name: z.string(),
  type: z.enum(["Person", "MusicGroup", "TVSeries", "Movie", "Event", "Organization"]),
  koreanName: z.string(),
  alternateNames: z.array(z.string()),
});

const Draft = z.object({
  facts: z.array(z.object({ id: z.string(), statement: z.string() })),
  title: z.string(),
  summary: z.string(),
  keyPoints: z.array(z.string()),
  entities: z.array(Entity),
  body: z.string(),
  faq: z.array(Faq),
  slug: z.string(),
  seoDescription: z.string(),
});
type Draft = z.infer<typeof Draft>;

const Localized = z.object({
  title: z.string(),
  summary: z.string(),
  keyPoints: z.array(z.string()),
  body: z.string(),
  faq: z.array(Faq),
});

const TARGET_LOCALES = ["ja", "zh-TW", "ko"] as const;

const autoPublish = process.env.AUTO_PUBLISH !== "false";

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

function kstToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function writeRequest(topic: Topic, headline: string, source: SourceMaterial): string {
  // today 는 바뀌는 값이라 시스템 프롬프트(캐시)가 아니라 요청 본문에 넣는다
  return JSON.stringify({
    today: kstToday(),
    topic: { keyword: topic.keyword, category: topic.category, format: topic.format, brief: topic.brief },
    source: {
      headline,
      publisher: source.publisher,
      kind: source.kind,
      text: source.text,
      comments: source.comments,
    },
  });
}

async function localize(draft: Draft, locale: (typeof TARGET_LOCALES)[number]) {
  const result = await callStructured({
    task: `localize-${locale}`,
    model: locale === "ja" ? MODELS.localizeJa : MODELS.localize,
    system: LOCALIZE_SYSTEM,
    user: JSON.stringify({
      targetLocale: locale,
      facts: draft.facts,
      draft: {
        title: draft.title,
        summary: draft.summary,
        keyPoints: draft.keyPoints,
        body: draft.body,
        faq: draft.faq,
      },
    }),
    schema: Localized,
    effort: "low",
  });
  if (locale === "ko") return result;
  return {
    title: stripHangulParens(result.title),
    summary: stripHangulParens(result.summary),
    keyPoints: result.keyPoints.map(stripHangulParens),
    body: stripHangulParens(result.body),
    faq: result.faq.map((f) => ({ q: stripHangulParens(f.q), a: stripHangulParens(f.a) })),
  };
}

async function writeTopic(topic: Topic): Promise<string> {
  const signal = await prisma.signal.findFirst({ where: { topicId: topic.id }, orderBy: { lastSeenAt: "desc" } });
  if (!signal) {
    throw new Error(`topic ${topic.id} has no signal`);
  }
  if (!topic.category || !topic.format) {
    throw new Error(`topic ${topic.id} missing category/format`);
  }

  const source = await fetchSourceMaterial(signal);
  const draft = await callStructured({
    task: "write",
    model: MODELS.write,
    system: WRITE_SYSTEM,
    user: writeRequest(topic, signal.title, source),
    schema: Draft,
    // 비용 절감: 사고(thinking) 토큰을 줄인다. 품질이 떨어지면 "medium"
    effort: "low",
  });

  const [year, month, day] = kstToday().split("-").map((part) => String(Number(part)));
  const warnings = unsupportedNumbers(draft, [year!, month!, day!]).map((n) => `number-not-in-facts:${n}`);
  const localized = await Promise.all(TARGET_LOCALES.map((locale) => localize(draft, locale)));

  const slug = slugify(draft.slug);
  const article = await prisma.article.create({
    data: {
      topicId: topic.id,
      category: topic.category,
      format: topic.format,
      riskTier: topic.riskTier,
      // 케이아지트처럼 바로 발행한다. 🔴 주제는 채점 단계에서 이미 빠진다.
      // 사람 승인을 다시 켜려면 AUTO_PUBLISH=false → `worker publish` 로 승인
      status: autoPublish ? "PUBLISHED" : "REVIEW",
      publishedAt: autoPublish ? new Date() : null,
      facts: { facts: draft.facts, warnings },
      entities: draft.entities,
      translations: {
        create: [
          {
            locale: "en",
            slug,
            title: stripHangulParens(draft.title),
            summary: stripHangulParens(draft.summary),
            keyPoints: draft.keyPoints.map(stripHangulParens),
            body: stripHangulParens(draft.body),
            faq: draft.faq.map((f) => ({ q: stripHangulParens(f.q), a: stripHangulParens(f.a) })),
            seoDesc: draft.seoDescription,
          },
          ...TARGET_LOCALES.map((locale, i) => {
            const t = localized[i]!;
            return {
              locale,
              slug,
              title: t.title,
              summary: t.summary,
              keyPoints: t.keyPoints,
              body: t.body,
              faq: t.faq,
            };
          }),
        ],
      },
      sources: { create: [{ url: source.url, publisher: source.publisher, kind: source.kind }] },
    },
  });
  if (warnings.length > 0) {
    log.warn("write: check warnings", { articleId: article.id, warnings });
  }
  await attachImage(article.id);
  return article.id;
}

export async function writeArticles(limit = 3): Promise<{ written: string[]; skipped: number }> {
  const topics = await prisma.topic.findMany({
    where: { status: "QUEUED", riskTier: { not: "RED" } },
    orderBy: { score: "desc" },
    take: limit,
  });

  const written: string[] = [];
  let skipped = 0;
  for (const topic of topics) {
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
      await prisma.topic.update({
        where: { id: topic.id },
        data: { status: permanent ? "SKIPPED" : "QUEUED" },
      });
      log.error("write: failed", { topic: topic.keyword, error: String(error), permanent });
    }
  }
  return { written, skipped };
}
