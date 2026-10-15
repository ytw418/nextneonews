import { prisma } from "@kmedia/db";

import type { CollectedSignal } from "./collectors/types";

// 한 번에 보내는 upsert 수. pg 풀 기본 크기(10)에 맞춘다
const CHUNK = 10;

// 같은 글은 (source, externalId) 로 한 줄만 두고, 다시 보이면 제목·숫자·lastSeenAt 을 갱신한다.
// 트랜잭션으로 묶지 않는다: DB가 멀면(Actions 미국 ↔ Neon 싱가포르) 5초 제한을 넘긴다. upsert 라 다시 돌려도 안전하다.
export async function upsertSignals(signals: CollectedSignal[]): Promise<number> {
  const now = new Date();
  for (let i = 0; i < signals.length; i += CHUNK) {
    await Promise.all(
      signals.slice(i, i + CHUNK).map((s) =>
        prisma.signal.upsert({
          where: { source_externalId: { source: s.source, externalId: s.externalId } },
          create: { ...s, metrics: { ...s.metrics }, firstSeenAt: now, lastSeenAt: now },
          update: { title: s.title, url: s.url, metrics: { ...s.metrics }, lastSeenAt: now },
        }),
      ),
    );
  }
  return signals.length;
}
