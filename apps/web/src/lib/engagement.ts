import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { articlePath, findEventForArticle, isLocale } from "@kmedia/core";
import { type Category, type Poll, prisma } from "@kmedia/db";

import { entityNames, type FeedRow, feedSelect, getArticle, listPopular } from "./articles";
import { clientIp, ipHash } from "./comments";
import { markdownToHtml } from "./markdown";
import { NEXT_MAX, pickNext, wantsGuide } from "./next-article";
import { country, isBot, rateLimited, voterHash } from "./voter";

// 글 참여 모듈(투표·반응·커뮤니티 반응·다음 글)의 서버 쪽. 화면 컴포넌트는 여기 타입만 가져간다 (import type)

const HOUR_MS = 3_600_000;
// 같은 사람(IP 해시)이 한 시간에 낼 수 있는 표·반응 수
const POLL_RATE_MAX = 30;
const REACTION_RATE_MAX = 60;

// ───────── 반응 버튼 ─────────
// '화나요'는 두지 않는다 (싸움 버튼이 되지 않게)
export const REACTION_TYPES = ["love", "wow", "more", "sad"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];
export type Reactions = Record<ReactionType, number>;

export function isReactionType(value: unknown): value is ReactionType {
  return typeof value === "string" && (REACTION_TYPES as readonly string[]).includes(value);
}

function count(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function readReactions(json: unknown): Reactions {
  const source = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  return Object.fromEntries(REACTION_TYPES.map((type) => [type, count(source[type])])) as Reactions;
}

export function reactionTotal(reactions: Reactions): number {
  return REACTION_TYPES.reduce((sum, type) => sum + reactions[type], 0);
}

// ───────── 투표 ─────────
export interface PollOption {
  id: string;
  label: string;
}

export interface PollView {
  id: string;
  question: string;
  options: PollOption[];
  totals: Record<string, number>;
  total: number;
}

// 언어별 결과 { [locale]: { [optionId]: 표 수 } }
export type PollByLocale = Record<string, Record<string, number>>;

export interface PollResults {
  totals: Record<string, number>;
  total: number;
  byLocale: PollByLocale;
}

export function isPollOpen(poll: Pick<Poll, "status" | "closesAt">, now = new Date()): boolean {
  return poll.status === "open" && (!poll.closesAt || poll.closesAt > now);
}

function readTotals(json: unknown): Record<string, number> {
  if (!json || typeof json !== "object") return {};
  return Object.fromEntries(Object.entries(json as Record<string, unknown>).map(([k, v]) => [k, count(v)]));
}

// 열린 투표 + 이 언어 문구(글은 Translation.poll, 주간은 labels[locale])가 있을 때만. 보기 수가 다르면 그리지 않는다
export function pollView(poll: Poll | null | undefined, text: unknown): PollView | null {
  if (!poll || !isPollOpen(poll) || !text || typeof text !== "object") return null;
  const { question, options } = text as { question?: unknown; options?: unknown };
  if (typeof question !== "string" || !question.trim() || !Array.isArray(options)) return null;
  if (options.length !== poll.optionIds.length || !options.every((o) => typeof o === "string" && o.trim())) return null;
  return {
    id: poll.id,
    question,
    options: poll.optionIds.map((id, i) => ({ id, label: String(options[i]) })),
    totals: readTotals(poll.totals),
    total: poll.total,
  };
}

export async function pollResults(pollId: string): Promise<PollResults> {
  const [poll, groups] = await Promise.all([
    prisma.poll.findUnique({ where: { id: pollId }, select: { totals: true, total: true } }),
    prisma.pollVote.groupBy({ by: ["locale", "option"], where: { pollId }, _count: { _all: true } }),
  ]);
  const byLocale: PollByLocale = {};
  for (const g of groups) {
    byLocale[g.locale] = { ...byLocale[g.locale], [g.option]: g._count._all };
  }
  return { totals: readTotals(poll?.totals), total: poll?.total ?? 0, byLocale };
}

export const VoteInput = z.object({
  option: z.string().min(1).max(16),
  locale: z.string().refine(isLocale),
});

export type VoteError = "invalid" | "bot" | "notFound" | "closed" | "tooFast";

export type VoteOutcome =
  | ({ status: 200 | 409 } & PollResults) // 409 = 이 기기는 이미 투표함 (지금 결과를 함께 준다)
  | { status: 400 | 403 | 404 | 410 | 429; error: VoteError };

// 한 기기 한 표 (voterHash scope 'poll:{id}'). 표 행과 totals(+1)를 한 트랜잭션으로 올린다
export async function castVote(pollId: string, input: z.infer<typeof VoteInput>, headers: Headers): Promise<VoteOutcome> {
  const ua = headers.get("user-agent");
  if (isBot(ua)) return { status: 403, error: "bot" };
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) return { status: 404, error: "notFound" };
  if (!isPollOpen(poll)) return { status: 410, error: "closed" };
  if (!poll.optionIds.includes(input.option)) return { status: 400, error: "invalid" };

  const ip = clientIp(headers);
  const hash = ipHash(ip);
  if (await rateLimited("poll", hash, POLL_RATE_MAX, HOUR_MS)) return { status: 429, error: "tooFast" };

  const voter = voterHash(`poll:${poll.id}`, ip, ua ?? "");
  const added = await prisma.$transaction(async (tx) => {
    const { count: inserted } = await tx.pollVote.createMany({
      data: [
        { pollId: poll.id, option: input.option, voterHash: voter, ipHash: hash, locale: input.locale, country: country(headers) },
      ],
      skipDuplicates: true,
    });
    if (inserted !== 1) return false;
    // 동시에 들어온 표가 서로 덮어쓰지 않게 jsonb 안의 숫자를 SQL 에서 올린다
    await tx.$executeRaw`UPDATE "Poll"
      SET "totals" = jsonb_set(coalesce("totals", '{}'::jsonb), ARRAY[${input.option}::text], to_jsonb(coalesce(("totals"->>${input.option}::text)::int, 0) + 1)),
          "total" = "total" + 1
      WHERE "id" = ${poll.id}`;
    return true;
  });
  return { status: added ? 200 : 409, ...(await pollResults(poll.id)) };
}

export type ReactionOutcome =
  | { status: 200; counted: boolean; reactions: Reactions }
  | { status: 403 | 404 | 429; error: VoteError };

// 반응은 한 기기가 종류마다 한 번. 처음 누른 것만 Article.reactions 를 +1 한다.
// Prisma update 는 updatedAt 을 바꿔서(글 '수정 시각'이 된다) SQL 로 reactions 만 올린다
export async function addReaction(articleId: string, type: ReactionType, headers: Headers): Promise<ReactionOutcome> {
  const ua = headers.get("user-agent");
  if (isBot(ua)) return { status: 403, error: "bot" };
  const article = await prisma.article.findFirst({ where: { id: articleId, status: "PUBLISHED" }, select: { id: true } });
  if (!article) return { status: 404, error: "notFound" };

  const ip = clientIp(headers);
  const hash = ipHash(ip);
  if (await rateLimited("reaction", hash, REACTION_RATE_MAX, HOUR_MS)) return { status: 429, error: "tooFast" };

  const voter = voterHash(`react:${article.id}`, ip, ua ?? "");
  const counted = await prisma.$transaction(async (tx) => {
    const { count: inserted } = await tx.reactionVote.createMany({
      data: [{ articleId: article.id, type, voterHash: voter, ipHash: hash }],
      skipDuplicates: true,
    });
    if (inserted !== 1) return false;
    await tx.$executeRaw`UPDATE "Article"
      SET "reactions" = jsonb_set(coalesce("reactions", '{}'::jsonb), ARRAY[${type}::text], to_jsonb(coalesce(("reactions"->>${type}::text)::int, 0) + 1))
      WHERE "id" = ${article.id} AND "status" = 'PUBLISHED'`;
    return true;
  });
  const row = await prisma.article.findUnique({ where: { id: article.id }, select: { reactions: true } });
  return { status: 200, counted, reactions: readReactions(row?.reactions) };
}

// ───────── 커뮤니티 반응 요약 ─────────
export interface NetizenMix {
  support: number;
  funny: number;
  critical: number;
  neutral: number;
}

export interface NetizenView {
  summary: string;
  quotes: string[];
  sourceUrl: string;
  commentCount: number;
  sampled: number;
  mix: NetizenMix | null;
}

function readMix(json: unknown): NetizenMix | null {
  if (!json || typeof json !== "object") return null;
  const m = json as Record<string, unknown>;
  const mix = { support: count(m.support), funny: count(m.funny), critical: count(m.critical), neutral: count(m.neutral) };
  // 합이 100 인 정수만 (파이프라인이 검사하지만 화면에서도 한 번 더)
  return mix.support + mix.funny + mix.critical + mix.neutral === 100 ? mix : null;
}

// 숫자(Article.netizen)와 이 언어 요약(Translation.netizen)이 둘 다 있을 때만. 원문 글·사진·닉네임은 없다
export function netizenView(articleNetizen: unknown, translationNetizen: unknown): NetizenView | null {
  if (!articleNetizen || typeof articleNetizen !== "object") return null;
  if (!translationNetizen || typeof translationNetizen !== "object") return null;
  const a = articleNetizen as Record<string, unknown>;
  const t = translationNetizen as Record<string, unknown>;
  if (typeof t.summary !== "string" || !t.summary.trim()) return null;
  if (typeof a.sourceUrl !== "string" || !/^https?:\/\//.test(a.sourceUrl)) return null;
  const quotes = Array.isArray(t.quotes) ? t.quotes.filter((q): q is string => typeof q === "string" && q.trim() !== "") : [];
  return {
    summary: t.summary,
    quotes: quotes.slice(0, 2),
    sourceUrl: a.sourceUrl,
    commentCount: count(a.commentCount),
    sampled: count(a.sampled),
    mix: readMix(a.mix),
  };
}

// ───────── 댓글 수 (하단 바·빈 상태를 서버에서 바로 그린다) ─────────
export function commentCount(articleId: string): Promise<number> {
  return prisma.comment.count({ where: { articleId, status: "VISIBLE" } });
}

// ───────── 다음 글 후보 ─────────
const GUIDE_CATEGORIES: Category[] = ["TRAVEL", "KBEAUTY"];
const NEWEST = [{ article: { publishedAt: "desc" as const } }, { articleId: "desc" as const }];

interface NextSubject {
  id: string;
  category: Category;
  entities: unknown;
  publishedAt: Date | null;
}

// 같은 인물 → (연예 글 + 다가오는 일정이면) 여행·뷰티 가이드 1개 → 같은 카테고리 → 이번 주 인기.
// 이번 주 인기는 글 페이지가 이미 불러온 목록을 넘겨받으면 다시 조회하지 않는다
export async function nextCandidates(
  locale: string,
  current: { slug: string; title: string; article: NextSubject },
  popular?: FeedRow[],
): Promise<FeedRow[]> {
  const { article } = current;
  const names = entityNames(article.entities).slice(0, 4);
  const hasEvent = Boolean(findEventForArticle({ title: current.title, entityNames: names, publishedAt: article.publishedAt }));
  const base = { locale, articleId: { not: article.id } };

  const [sameEntity, guide, sameCategory, popularRows] = await Promise.all([
    names.length > 0
      ? prisma.translation.findMany({
          where: {
            ...base,
            article: { status: "PUBLISHED", OR: names.map((name) => ({ entities: { array_contains: [{ name }] } })) },
          },
          orderBy: NEWEST,
          take: NEXT_MAX,
          select: feedSelect,
        })
      : [],
    wantsGuide(article.category, hasEvent)
      ? prisma.translation.findMany({
          where: {
            ...base,
            article: { status: "PUBLISHED", category: { in: GUIDE_CATEGORIES }, format: { in: ["GUIDE", "QNA"] } },
          },
          // 가이드는 오래 읽히는 글이라 최신보다 많이 본 순
          orderBy: [{ article: { views: "desc" } }, ...NEWEST],
          take: 3,
          select: feedSelect,
        })
      : [],
    prisma.translation.findMany({
      where: { ...base, article: { status: "PUBLISHED", category: article.category } },
      orderBy: NEWEST,
      take: NEXT_MAX + 2,
      select: feedSelect,
    }),
    popular ?? listPopular(locale, 12),
  ]);

  return pickNext(
    { slug: current.slug, category: article.category, hasEvent },
    { sameEntity, guide, sameCategory, popular: popularRows },
  );
}

// ───────── 이어 붙이는 다음 글 (/api/article) ─────────
export interface AppendedHero {
  url: string;
  width: number | null;
  height: number | null;
  credit: string | null;
  author: string | null;
  licenseName: string | null;
  licenseUrl: string | null;
  sourceUrl: string | null;
}

export interface AppendedArticleData {
  id: string;
  slug: string;
  url: string; // 언어 접두사가 붙은 경로 (/en/news/…)
  title: string;
  summary: string;
  category: string;
  categoryLabel: string;
  publishedAt: string | null;
  hero: AppendedHero | null;
  keyPoints: string[];
  bodyHtml: string;
  poll: PollView | null;
  reactions: Reactions;
  commentCount: number;
}

export async function appendedArticle(locale: string, slug: string): Promise<AppendedArticleData | null> {
  const translation = await getArticle(locale, slug);
  if (!translation) return null;
  const { article } = translation;
  const [tCat, comments] = await Promise.all([
    getTranslations({ locale, namespace: "Category" }),
    commentCount(article.id),
  ]);
  const hero = article.media[0];
  const keyPoints = Array.isArray(translation.keyPoints)
    ? translation.keyPoints.filter((p): p is string => typeof p === "string")
    : [];
  return {
    id: article.id,
    slug: translation.slug,
    url: articlePath(locale, translation.slug),
    title: translation.title,
    summary: translation.summary,
    category: article.category,
    categoryLabel: tCat(article.category),
    publishedAt: article.publishedAt?.toISOString() ?? null,
    hero: hero
      ? {
          url: hero.url,
          width: hero.width,
          height: hero.height,
          credit: hero.credit,
          author: hero.author,
          licenseName: hero.licenseName,
          licenseUrl: hero.licenseUrl,
          sourceUrl: hero.sourceUrl,
        }
      : null,
    keyPoints,
    bodyHtml: markdownToHtml(translation.body),
    poll: pollView(article.poll, translation.poll),
    reactions: readReactions(article.reactions),
    commentCount: comments,
  };
}
