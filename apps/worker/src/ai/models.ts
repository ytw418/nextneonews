import type Anthropic from "@anthropic-ai/sdk";

// 단계별 모델 (docs/PRD.md 8.2: 채점·번역은 Haiku, 작성은 Sonnet). 품질이 부족하면 여기만 바꾼다.
export const MODELS = {
  // 1편을 4개 언어로 한 번에 쓴다. 비용 우선 Haiku (1편 약 3원). 품질을 올리려면 "claude-sonnet-5-5"
  write: "claude-haiku-5-5",
  // 영어판을 vi·id·fr·ru 로 옮기는 배치 번역 (배치 50% 할인, 1편 4개 언어 약 4원)
  translate: "claude-haiku-5-5",
  // GEO 측정용 웹 검색 답변 (web_search_20260209 는 Sonnet 4.6 이상 필요)
  geo: "claude-sonnet-5-5",
} as const;

// 웹 검색 1회 $0.01 ($10 / 1,000건)
const WEB_SEARCH_USD = 0.01;

// $ / 1M tokens (2026-10 공식 가격). 캐시 쓰기는 입력가의 1.25배, 읽기는 0.1배.
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-opus-5-5": { input: 4, output: 20 },
};
// 거절 시 다른 모델이 대신 답했는데 표에 없으면 가장 비싼 값으로 잡는다 (과소 집계 방지).
const FALLBACK_PRICE = { input: 10, output: 50 };

// 배치 API 는 모든 토큰이 반값이다
export const BATCH_DISCOUNT = 0.5;

export function costUsd(model: string, usage: Anthropic.Usage | Anthropic.Beta.BetaUsage): number {
  const price = PRICES[model] ?? FALLBACK_PRICE;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const dollars =
    usage.input_tokens * price.input +
    cacheWrite * price.input * 1.25 +
    cacheRead * price.input * 0.1 +
    usage.output_tokens * price.output;
  const searches = usage.server_tool_use?.web_search_requests ?? 0;
  return dollars / 1_000_000 + searches * WEB_SEARCH_USD;
}

// 호출 전 예산 확인용: 입력 토큰 추정치와 max_tokens 를 모두 쓴다고 가정한 최악의 비용
export function worstCaseUsd(model: string, inputChars: number, maxTokens: number): number {
  const price = PRICES[model] ?? FALLBACK_PRICE;
  const inputTokens = inputChars; // 한글은 대략 글자당 1토큰 이하라 글자 수를 그대로 상한으로 쓴다
  return (inputTokens * price.input + maxTokens * price.output) / 1_000_000;
}

export function isKnownModel(model: string): boolean {
  return model in PRICES;
}
