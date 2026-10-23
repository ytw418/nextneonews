import { randomBytes } from "node:crypto";

import { z } from "zod";

import type { Locale } from "@kmedia/core";
import { type Entity, prisma, type Signal, type Topic } from "@kmedia/db";

import { BudgetExceededError } from "../ai/budget";
import { callStructured, RefusalError } from "../ai/client";
import { MODELS } from "../ai/models";
import { WRITE_SYSTEM } from "../ai/prompts";
import { attachImage } from "../entities/images";
import { findEntities } from "../entities/match";
import { log } from "../log";
import { type AnnouncedPage, announce } from "./announce";
import { foreignNames, headlineTooLong, overlapRatio, replaceForeign, unsupportedNumbers } from "./checks";
import { gateTopic, OffTopicError } from "./gate";
import { pickSentences } from "./extract";
import { buildFactPack, MIN_FACT_CHARS } from "./factpack";
import { isIndexable } from "./indexable";
import { clean, Localized, OPTION_IDS, shape, simplified } from "./localized";
import { NetizenMix, sampleComments, validMix } from "./netizen";
import { fetchSourceMaterial, type SourceMaterial, SourceUnavailableError } from "./sources";

// 한 번의 호출로 사실 목록 + 4개 언어 기사(투표·반응 요약 포함)를 받는다 (예전: 작성 1회 + 번역 3회)
const Draft = z.object({
  facts: z.array(z.object({ id: z.string(), statement: z.string() })),
  slug: z.string(),
  seoDescription: z.string(),
  en: Localized,
  ja: Localized,
  zhTW: Localized,
  ko: Localized,
  netizenMix: NetizenMix.nullable(),
});

const autoPublish = process.env.AUTO_PUBLISH !== "false";

// 사실 출처로 읽을 수 있는 소스 (sources.ts readFact). 커뮤니티·케이아지트·아이돌차트 신호만 있는 주제는 이 중 하나가 같이 묶여야 글이 된다
const NEWS_SOURCES = new Set(["yonhap", "google-trends", "osen", "xportsnews", "dispatch", "tenasia", "sportsseoul", "manual-manual"]);

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

function glossary(entities: Entity[]) {
  return entities.slice(0, 8).map((e) => ({ ko: e.ko, en: e.en, ja: e.ja, zhHant: e.zhHant }));
}

// 구조화 데이터(JSON-LD about)용 등장 인물: AI 대신 사전에서 만든다. id(위키데이터 Q-id)는 sameAs 에 쓴다
function entityJson(entities: Entity[]) {
  const typeMap: Record<string, string> = { group: "MusicGroup", singer: "Person", actor: "Person", series: "TVSeries" };
  return entities.slice(0, 6).map((e) => ({
    id: e.id,
    name: e.en ?? e.ko ?? "",
    type: typeMap[e.type] ?? "Thing",
    koreanName: e.ko ?? "",
    alternateNames: [e.ja, e.zhHant].filter((n): n is string => Boolean(n)),
  }));
}

// 반응 요약용 커뮤니티 댓글 표본 (사실 출처로는 쓰지 않는다)
interface Reaction {
  signal: Signal;
  comments: string[];
}

function writeRequest(
  topic: Topic,
  headline: string,
  source: SourceMaterial,
  entities: Entity[],
  reaction: Reaction | null,
): string {
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
    ...(reaction ? { reactions: { comments: reaction.comments } } : {}),
  });
}

// 한국어판이 원문을 이만큼 넘게 그대로 쓰면 사람이 확인할 때까지 발행하지 않는다
const MAX_OVERLAP = 0.25;

type Draft = z.infer<typeof Draft>;

function generate(user: string): Promise<Draft> {
  return callStructured({
    task: "write",
    model: MODELS.write,
    system: WRITE_SYSTEM,
    user,
    schema: Draft,
    effort: "low",
    maxTokens: 12000,
  });
}

interface SaveInput {
  topic: Topic & { category: NonNullable<Topic["category"]>; format: NonNullable<Topic["format"]> };
  draft: Draft;
  sources: { url: string; publisher: string; kind: "OFFICIAL" | "NEWS" | "COMMUNITY" }[];
  sourceText: string; // 겹침 검사용 (저장하지 않는다)
  entities: Entity[];
  reaction?: Reaction | null;
}

// 4개 언어 보기 수가 같을 때만 투표를 연다 (표는 언어와 상관없이 optionIds 로 합산한다). 위험 등급이 GREEN 인 글만
function pollOptionIds(riskTier: Topic["riskTier"], drafts: Localized[]): string[] | null {
  if (riskTier !== "GREEN") return null;
  const counts = new Set(drafts.map((t) => t.poll?.options.length ?? 0));
  const [n = 0] = counts;
  return counts.size === 1 && n > 0 ? OPTION_IDS.slice(0, n) : null;
}

// 검사(숫자·원문 겹침) 뒤 기사와 5개 언어판을 저장한다. 경고가 있으면 사람 확인(REVIEW)으로 둔다
async function saveArticle({ topic, draft, sources, sourceText, entities, reaction }: SaveInput): Promise<Saved> {
  const [year, month, day] = kstToday().split("-").map((part) => String(Number(part)));
  const warnings = unsupportedNumbers({ facts: draft.facts, ...clean(draft.en) }, [year!, month!, day!]).map(
    (n) => `number-not-in-facts:${n}`,
  );
  const overlap = overlapRatio(sourceText, draft.ko.body);
  if (overlap > MAX_OVERLAP) warnings.push(`source-overlap:${overlap.toFixed(2)}`);

  const slug = slugify(draft.slug);
  // 한 번에 네 언어를 쓰다 보니 다른 언어판 표기가 새어 들어온다 (zh-TW 의 "イム・シワン", ja 의 "ITZY채령").
  // 사전 표기로 바꾸고, 제목·요약에 그래도 남으면 사람이 볼 때까지 발행하지 않는다. 본문에만 남은 것(방송명 인용 등)은 경고만
  const fixScript = <T extends Localized>(locale: Locale, t: T): T => {
    const names = foreignNames(entities, locale);
    const { value, left } = replaceForeign(t, locale, names);
    const head = replaceForeign([value.title, value.seoTitle, value.summary, ...value.keyPoints], locale, names).left;
    if (head.length > 0) warnings.push(`foreign-script:${locale}:${head.slice(0, 3).join("/")}`);
    else if (left.length > 0) warnings.push(`foreign-script-body:${locale}:${left.slice(0, 3).join("/")}`);
    return value;
  };
  const en = fixScript("en", clean(draft.en));
  const ja = fixScript("ja", clean(draft.ja));
  const zhTW = fixScript("zh-TW", clean(draft.zhTW));
  const ko = fixScript("ko", shape(draft.ko));
  const publish = autoPublish && !warnings.some((w) => w.startsWith("source-overlap") || w.startsWith("foreign-script:"));
  const locales: [Locale, Localized][] = [
    ["en", en],
    ["ja", ja],
    ["zh-TW", zhTW],
    ["zh-CN", simplified(zhTW)], // 간체는 AI 대신 OpenCC 변환 (0원)
    ["ko", ko],
  ];
  const optionIds = pollOptionIds(topic.riskTier, [en, ja, zhTW, ko]);
  // 반응 카드는 영어판 요약이 있을 때만 (숫자·원문 링크는 Article.netizen, 언어별 문구는 Translation.netizen)
  const withNetizen = reaction != null && en.netizen != null;
  const now = new Date();
  // 카드에서 4줄을 넘길 만큼 긴 제목은 경고만 남긴다 (발행은 막지 않는다)
  for (const [locale, t] of locales) if (headlineTooLong(locale, t.title)) warnings.push(`headline-too-long:${locale}`);
  const article = await prisma.article.create({
    data: {
      topicId: topic.id,
      category: topic.category,
      format: topic.format,
      riskTier: topic.riskTier,
      // 케이아지트처럼 바로 발행한다. 사람 승인을 다시 켜려면 AUTO_PUBLISH=false → `worker publish`
      status: publish ? "PUBLISHED" : "REVIEW",
      publishedAt: publish ? now : null,
      contentUpdatedAt: now,
      facts: { facts: draft.facts, warnings },
      entities: entityJson(entities),
      ...(withNetizen
        ? {
            netizen: {
              sourceUrl: reaction.signal.url,
              commentCount: Number((reaction.signal.metrics as { comments?: unknown }).comments) || reaction.comments.length,
              sampled: reaction.comments.length,
              mix: validMix(draft.netizenMix),
              at: now.toISOString(),
            },
          }
        : {}),
      ...(optionIds ? { poll: { create: { kind: "article", optionIds } } } : {}),
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
          indexable: isIndexable(locale, topic.category, topic.format),
          ...(optionIds && t.poll ? { poll: t.poll } : {}),
          ...(withNetizen && t.netizen ? { netizen: t.netizen } : {}),
          ...(locale === "en" ? { seoDesc: draft.seoDescription } : {}),
        })),
      },
      sources: { create: sources },
    },
  });
  if (warnings.length > 0) log.warn("write: check warnings", { articleId: article.id, warnings, published: publish });
  await attachImage(article.id);
  // 발행했으면 알릴 언어판을 돌려준다. 사이트 캐시 비우기·미리 요청은 이번 실행의 글을 모아 끝에 한 번 한다 (writeArticles)
  const pages: AnnouncedPage[] = publish
    ? locales.map(([locale]) => ({
        locale,
        slug,
        category: topic.category,
        indexable: isIndexable(locale, topic.category, topic.format),
      }))
    : [];
  return { articleId: article.id, pages };
}

interface Saved {
  articleId: string;
  pages: AnnouncedPage[]; // 바로 발행했으면 그 언어판들 (사람 확인 대기면 빈 배열)
}

// 더쿠 신호가 있으면 댓글을 따로 받아 표본을 만든다 (반응 요약용). 못 받아도 글은 쓴다
const MIN_REACTIONS = 10; // 이보다 적으면 '경향'이라 부를 수 없다

async function readReaction(signals: Signal[]): Promise<Reaction | null> {
  const signal = signals.find((s) => s.source === "theqoo");
  if (!signal) return null;
  try {
    const material = await fetchSourceMaterial(signal, { role: "reaction" });
    const comments = sampleComments(material.comments);
    if (comments.length >= MIN_REACTIONS) return { signal, comments };
    log.info("write: too few reactions", { url: signal.url, comments: comments.length });
  } catch (error) {
    log.warn("write: reactions skipped", { url: signal.url, error: String(error) });
  }
  return null;
}

// 뉴스·화제 주제: 원문 한 편에서 사실을 뽑아 쓴다
async function writeNews(input: SaveInput["topic"]): Promise<Saved> {
  let topic = input;
  // 같은 주제에 신호가 여럿이면 사실을 확인할 수 있는 뉴스를 먼저 쓴다 (커뮤니티 글은 화제 신호일 뿐이다)
  const signals = await prisma.signal.findMany({ where: { topicId: topic.id }, orderBy: { lastSeenAt: "desc" } });
  const signal = signals.find((s) => NEWS_SOURCES.has(s.source)) ?? signals[0];
  if (!signal) throw new Error(`topic ${topic.id} has no signal`);

  const source = await fetchSourceMaterial(signal);
  // 한류·한국 생활과 무관하면 여기서 멈춘다 (OffTopicError → SKIPPED). 관련 있으면 분류를 AI 판정으로 바꾼다
  const category = await gateTopic(signal.title, source.text);
  if (category !== topic.category) {
    await prisma.topic.update({ where: { id: topic.id }, data: { category } });
    topic = { ...topic, category };
  }
  const reaction = await readReaction(signals);
  const entities = await findEntities(`${signal.title} ${source.text.slice(0, 600)}`);
  const draft = await generate(writeRequest(topic, signal.title, source, entities, reaction));
  const sources: SaveInput["sources"] = [{ url: source.url, publisher: source.publisher, kind: source.kind }];
  // 반응을 가져온 더쿠 글은 '반응 출처'로 남긴다 (글 화면에서 nofollow 링크)
  if (reaction && reaction.signal.url !== source.url) {
    sources.push({ url: reaction.signal.url, publisher: "theqoo", kind: "COMMUNITY" });
  }
  return saveArticle({ topic, draft, sources, sourceText: source.text, entities, reaction });
}

// 가이드 주제: 공식 페이지 사실 목록으로만 쓴다 (숫자·요금·날짜는 목록에 있는 것만)
async function writeGuide(topic: SaveInput["topic"]): Promise<Saved> {
  const keywords = `${topic.keyword} ${topic.angle ?? ""}`.split(/[\s:·,()'"?]+/).filter((w) => w.length > 1);
  const pack = await buildFactPack(topic.factUrls, keywords);
  const factChars = pack.reduce((n, p) => n + p.text.length, 0);
  if (factChars < MIN_FACT_CHARS) {
    throw new SourceUnavailableError(`fact pack too thin (${factChars} chars): ${topic.keyword}`);
  }
  const entities = await findEntities(topic.keyword);
  const user = JSON.stringify({
    today: kstToday(),
    mode: "guide",
    topic: { angle: topic.angle, angleKo: topic.keyword, category: topic.category, format: topic.format },
    glossary: glossary(entities),
    officialFacts: pack,
  });
  const draft = await generate(user);
  return saveArticle({
    topic,
    draft,
    sources: pack.map((p) => ({ url: p.url, publisher: p.publisher, kind: "OFFICIAL" as const })),
    sourceText: pack.map((p) => p.text).join(" "),
    entities,
  });
}

async function writeTopic(topic: Topic): Promise<Saved> {
  const { category, format } = topic;
  if (!category || !format) throw new Error(`topic ${topic.id} missing category/format`);
  const ready = { ...topic, category, format };
  return topic.factUrls.length > 0 ? writeGuide(ready) : writeNews(ready);
}

const CONCURRENCY = 4;

export async function writeArticles(limit = 3): Promise<{ written: string[]; skipped: number }> {
  const topics = await prisma.topic.findMany({
    where: { status: "QUEUED", riskTier: { not: "RED" } },
    orderBy: { score: "desc" },
    take: limit,
  });

  const written: string[] = [];
  const published: AnnouncedPage[] = [];
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
      const { articleId, pages } = await writeTopic(topic);
      await prisma.topic.update({ where: { id: topic.id }, data: { status: "DONE" } });
      written.push(articleId);
      published.push(...pages);
      log.info("write: article created", { topic: topic.keyword, articleId });
    } catch (error) {
      if (error instanceof BudgetExceededError) {
        await prisma.topic.update({ where: { id: topic.id }, data: { status: "QUEUED" } });
        throw error;
      }
      skipped += 1;
      // 거절·원문 없음은 다시 시도해도 같으니 건너뛴다. 그 밖의 오류는 큐로 되돌린다.
      const permanent =
        error instanceof RefusalError || error instanceof SourceUnavailableError || error instanceof OffTopicError;
      await prisma.topic.update({ where: { id: topic.id }, data: { status: permanent ? "SKIPPED" : "QUEUED" } });
      log.error("write: failed", { topic: topic.keyword, error: String(error), permanent });
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, topics.length) }, worker));
  } finally {
    // 발행한 글은 모아서 한 번에 알린다: 홈·피드·카테고리를 글마다 다시 그리지 않게 (예산 초과로 멈춰도 이미 낸 글은 알린다)
    await announce(published);
  }
  log.info("write: done", { written: written.length, skipped });
  return { written, skipped };
}
