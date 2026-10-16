import { log } from "../log";

// 자동 수집을 하지 않는 커뮤니티(디시·인스티즈)의 주제를 사람이 씨앗으로 넣는다.
// 제목만 Signal 로 남기고 URL 은 기록만 한다 (요청하지 않는다). 지금은 CLI 자리만 있다
export const SEED_SOURCES = ["dc", "instiz", "manual"] as const;
export type SeedSource = (typeof SEED_SOURCES)[number];

export function isSeedSource(value: string): value is SeedSource {
  return (SEED_SOURCES as readonly string[]).includes(value);
}

export async function seedTopic(_title: string, _options: { source: SeedSource; url?: string }): Promise<void> {
  log.info("seed-topic: not implemented");
}
