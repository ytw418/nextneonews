import { z } from "zod";

import { stripHangulParens } from "./checks";
import { toSimplified } from "./simplified";

// 독자 투표 문구 (언어마다 하나). 보기 순서는 Poll.optionIds 와 같다
export const PollText = z.object({ question: z.string(), options: z.array(z.string()) });
export type PollText = z.infer<typeof PollText>;

// 한국 커뮤니티 반응 요약. 원문 댓글이 아니라 바꿔 쓴 요약과 짧은 인용(2개까지)만 둔다
export const NetizenText = z.object({ summary: z.string(), quotes: z.array(z.string()) });
export type NetizenText = z.infer<typeof NetizenText>;

// 언어 하나 분량의 기사. 작성(write)과 배치 번역(translate)이 같은 모양을 쓴다
// 보기·인용 개수는 스키마로 막지 않고 shape() 에서 고친다 — 한 칸이 어긋났다고 글 전체 응답을 버리면 돈이 다시 든다
const Faq = z.object({ q: z.string(), a: z.string() });
export const Localized = z.object({
  title: z.string(),
  seoTitle: z.string(),
  summary: z.string(),
  keyPoints: z.array(z.string()),
  body: z.string(),
  faq: z.array(Faq),
  poll: PollText.nullable(),
  netizen: NetizenText.nullable(),
});
export type Localized = z.infer<typeof Localized>;

export const OPTION_IDS = ["a", "b", "c", "d"] as const;
const MAX_QUOTES = 2;

// 보기가 2~4개가 아니거나 빈 칸이 있으면 투표를 열지 않는다
export function shapePoll(poll: PollText | null): PollText | null {
  if (!poll) return null;
  const question = poll.question.trim();
  const options = poll.options.map((o) => o.trim());
  if (!question || options.length < 2 || options.length > OPTION_IDS.length || options.some((o) => !o)) return null;
  return { question, options };
}

function shapeNetizen(netizen: NetizenText | null): NetizenText | null {
  const summary = netizen?.summary.trim();
  if (!netizen || !summary) return null;
  return { summary, quotes: netizen.quotes.map((q) => q.trim()).filter(Boolean).slice(0, MAX_QUOTES) };
}

// 개수 규칙만 맞춘다 (ko 처럼 한글을 지우면 안 되는 언어에 쓴다)
export function shape(t: Localized): Localized {
  return { ...t, poll: shapePoll(t.poll), netizen: shapeNetizen(t.netizen) };
}

export function cleanPoll(poll: PollText | null): PollText | null {
  const p = shapePoll(poll);
  return p && shapePoll({ question: stripHangulParens(p.question), options: p.options.map(stripHangulParens) });
}

// 번역문에 남은 한글 괄호를 지운다 (ko 는 그대로)
export function clean(t: Localized): Localized {
  const netizen = shapeNetizen(t.netizen);
  return {
    title: stripHangulParens(t.title),
    seoTitle: stripHangulParens(t.seoTitle),
    summary: stripHangulParens(t.summary),
    keyPoints: t.keyPoints.map(stripHangulParens),
    body: stripHangulParens(t.body),
    faq: t.faq.map((f) => ({ q: stripHangulParens(f.q), a: stripHangulParens(f.a) })),
    poll: cleanPoll(t.poll),
    netizen: netizen && shapeNetizen({ summary: stripHangulParens(netizen.summary), quotes: netizen.quotes.map(stripHangulParens) }),
  };
}

// 번역판 투표 문구: 영어판에 투표가 없으면 없음, 보기 수가 영어판과 다르면 영어 문구를 쓴다 (표는 하나로 합산된다)
export function alignPoll(en: PollText | null, translated: PollText | null): PollText | null {
  if (!en) return null;
  return translated && translated.options.length === en.options.length ? translated : en;
}

// toSimplified 는 기사 필드만 바꾸므로 투표·반응 문구는 keyPoints 자리를 빌려 같은 변환기로 바꾼다
function toCNLines(lines: string[]): string[] {
  return toSimplified({ title: "", summary: "", keyPoints: lines, body: "", faq: [] }).keyPoints;
}

export function simplifiedPoll(poll: PollText | null): PollText | null {
  if (!poll) return null;
  const [question = "", ...options] = toCNLines([poll.question, ...poll.options]);
  return { question, options };
}

// 번체(zh-TW) → 간체(zh-CN). AI 호출 없음
export function simplified(t: Localized): Localized {
  const netizen = t.netizen && toCNLines([t.netizen.summary, ...t.netizen.quotes]);
  return {
    ...toSimplified(t),
    poll: simplifiedPoll(t.poll),
    netizen: netizen && { summary: netizen[0] ?? "", quotes: netizen.slice(1) },
  };
}
