import { z } from "zod";

// 커뮤니티(더쿠) 댓글 표본 → AI 반응 요약의 입력. 원문 댓글은 저장하지 않고 요약·숫자만 남긴다 (docs/PRD.md 5장)

const MIN_CHARS = 5;
const MAX_CHARS = 120;
const MAX_SAMPLES = 60;

// 국가·인종·성별·지역·장애 비하와 심한 욕설·위협. 걸린 댓글은 AI 에 넘기지도 않는다 (요약·인용에 섞이지 않게)
// "한남동"·"시발점"처럼 흔한 낱말과 겹치는 것은 뒤를 막거나 넣지 않았다
const BANNED = new RegExp(
  [
    "짱[깨께개꼴]",
    "쪽[바빠]리",
    "쪽발이",
    "왜놈",
    "섬숭이",
    "조센징",
    "똥남아",
    "깜둥이",
    "니거",
    "김치녀",
    "된장녀",
    "한남(?!동|대교|역|더힐)",
    "한녀",
    "냄저",
    "메갈",
    "꼴페미",
    "페미년",
    "보슬아치",
    "창녀",
    "창년",
    "맘충",
    "홍어",
    "틀딱",
    "급식충",
    "[병븅]신",
    "애자",
    "씨발",
    "시발(?!점)",
    "ㅅㅂ",
    "ㅆㅂ",
    "개새",
    "좆",
    "니애미",
    "느금",
    "엠창",
    "뒤져",
    "뒈져",
    "죽어라",
    "자살해",
  ].join("|"),
);

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };

function plain(comment: string): string {
  return comment
    .replace(/<[^>]*>/g, " ")
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, name: string) => ENTITIES[name] ?? " ")
    .replace(/https?:\/\/\S+|www\.\S+/gi, " ")
    .replace(/@\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 태그·URL·@멘션을 지우고, 짧은 것·중복·비하 표현을 뺀 뒤 120자로 잘라 60개까지 남긴다
export function sampleComments(comments: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of comments) {
    const text = plain(raw);
    const chars = Array.from(text);
    if (chars.length < MIN_CHARS || seen.has(text)) continue;
    seen.add(text);
    if (BANNED.test(text)) continue;
    out.push(chars.slice(0, MAX_CHARS).join(""));
    if (out.length >= MAX_SAMPLES) break;
  }
  return out;
}

// 반응 비율 (AI 가 매긴다). 합이 100 인 정수
export const NetizenMix = z.object({
  support: z.number(),
  funny: z.number(),
  critical: z.number(),
  neutral: z.number(),
});
export type NetizenMix = z.infer<typeof NetizenMix>;

// 0 이상 정수이고 합이 정확히 100 일 때만 쓴다. 틀리면 막대를 그리지 않는다
export function validMix(mix: NetizenMix | null): NetizenMix | null {
  if (!mix) return null;
  const values = [mix.support, mix.funny, mix.critical, mix.neutral];
  const ok = values.every((v) => Number.isInteger(v) && v >= 0) && values.reduce((a, b) => a + b, 0) === 100;
  return ok ? { support: mix.support, funny: mix.funny, critical: mix.critical, neutral: mix.neutral } : null;
}
