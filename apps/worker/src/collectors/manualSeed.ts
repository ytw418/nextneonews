import { createHash } from "node:crypto";

import { kstToday } from "@kmedia/core";

import { log } from "../log";
import { upsertSignals } from "../store";
import type { CollectedSignal } from "./types";

// 자동 수집을 하지 않는 커뮤니티(디시·인스티즈)의 주제를 사람이 씨앗으로 넣는다 (policy.ts 가 요청을 막는다).
// 제목만 Signal 로 남기고 URL 은 기록만 한다 (요청하지 않는다). 이후 check → write 가 같은 인물·작품의 뉴스와 묶어 쓴다
export const SEED_SOURCES = ["dc", "instiz", "manual"] as const;
export type SeedSource = (typeof SEED_SOURCES)[number];

export function isSeedSource(value: string): value is SeedSource {
  return (SEED_SOURCES as readonly string[]).includes(value);
}

export async function seedTopic(title: string, options: { source: SeedSource; url?: string }): Promise<void> {
  const url = options.url?.trim() ?? "";
  if (url && !/^https?:\/\//.test(url)) {
    log.error("seed-topic: --url 은 http(s) 주소여야 한다", { url });
    process.exitCode = 1;
    return;
  }
  // 같은 날 같은 제목은 한 줄 (다시 넣어도 lastSeenAt 만 바뀐다)
  const externalId = createHash("sha1").update(`${title}${kstToday()}`).digest("hex").slice(0, 12);
  const signal: CollectedSignal = { source: `manual-${options.source}`, externalId, title, url, lang: "ko", metrics: {} };
  await upsertSignals([signal]);
  log.info("seed-topic: saved", { source: signal.source, externalId, title });
}
