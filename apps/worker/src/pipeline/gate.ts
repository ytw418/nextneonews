import { CATEGORIES, type CategoryKey } from "@kmedia/core";
import { z } from "zod";

import { callStructured } from "../ai/client";
import { MODELS } from "../ai/models";
import { GATE_SYSTEM } from "../ai/prompts";

// 작성 직전 관련성 판정. 규칙 필터(heuristics)는 이름 겹침(가수 '동해' ↔ 동해시)·부분 일치('밀입국'의 '입국')로
// 일반 사회 뉴스를 K-POP·여행으로 통과시켰다 (2026-10-20 최근 50편 중 절반). 제목과 원문 앞부분만 보내는 짧은 호출(1원 미만)로
// 무관한 주제는 쓰지 않고(작성 1편 약 4원을 아낀다), 관련 주제는 분류를 다시 매긴다
export const Gate = z.object({
  relevant: z.boolean(),
  category: z.enum(CATEGORIES),
  reason: z.string(),
});
export type Gate = z.infer<typeof Gate>;

export class OffTopicError extends Error {}

const SOURCE_CHARS = 800;

export function judgeTopic(title: string, text: string): Promise<Gate> {
  return callStructured({
    task: "gate",
    model: MODELS.gate,
    system: GATE_SYSTEM,
    user: JSON.stringify({ title, text: text.slice(0, SOURCE_CHARS) }),
    schema: Gate,
    effort: "low",
    maxTokens: 400,
  });
}

// 무관하면 OffTopicError (주제는 SKIPPED 로 남는다), 관련 있으면 AI 가 고른 분류
export async function gateTopic(title: string, text: string): Promise<CategoryKey> {
  const gate = await judgeTopic(title, text);
  if (!gate.relevant) throw new OffTopicError(`off-topic: ${gate.reason}`);
  return gate.category;
}
