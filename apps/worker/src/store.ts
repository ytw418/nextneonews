import { prisma } from "@kmedia/db";

import type { CollectedSignal, SignalMetrics } from "./collectors/types";

// 한 번에 보내는 upsert 수. pg 풀 기본 크기(10)에 맞춘다
const CHUNK = 10;
// 직전 관측이 이 시간 안이면 조회 증가 속도(시간당)를 계산한다
const VELOCITY_WINDOW_H = 6;
// 몇 분 만에 다시 돌리면 속도가 튀므로 직전 계산값을 그대로 둔다
const MIN_INTERVAL_H = 0.1;

interface Seen {
  metrics: SignalMetrics;
  lastSeenAt: Date;
}

function withVelocity(metrics: SignalMetrics, prev: Seen | undefined, now: Date): SignalMetrics {
  if (!prev || metrics.views === undefined || prev.metrics.views === undefined) return metrics;
  const hours = (now.getTime() - prev.lastSeenAt.getTime()) / 3600_000;
  if (hours > VELOCITY_WINDOW_H) return metrics;
  if (hours < MIN_INTERVAL_H) {
    const { prevViews, prevAt, velocity } = prev.metrics;
    return velocity === undefined ? metrics : { ...metrics, prevViews, prevAt, velocity };
  }
  return {
    ...metrics,
    prevViews: prev.metrics.views,
    prevAt: prev.lastSeenAt.toISOString(),
    velocity: Math.round((metrics.views - prev.metrics.views) / hours),
  };
}

const keyOf = (s: { source: string; externalId: string }) => `${s.source}\u0000${s.externalId}`;

// 같은 글은 (source, externalId) 로 한 줄만 두고, 다시 보이면 제목·숫자·lastSeenAt 을 갱신한다.
// 갱신 전에 직전 숫자를 읽어 조회 증가 속도(velocity)를 붙인다 — 더쿠 목록은 최신순이라 이것으로 반응 크기를 본다.
// 트랜잭션으로 묶지 않는다: DB가 멀면(Actions 미국 ↔ Neon 싱가포르) 5초 제한을 넘긴다. upsert 라 다시 돌려도 안전하다.
export async function upsertSignals(signals: CollectedSignal[]): Promise<number> {
  const now = new Date();
  for (let i = 0; i < signals.length; i += CHUNK) {
    const chunk = signals.slice(i, i + CHUNK);
    const existing = await prisma.signal.findMany({
      where: { OR: chunk.map((s) => ({ source: s.source, externalId: s.externalId })) },
      select: { source: true, externalId: true, metrics: true, lastSeenAt: true },
    });
    const seen = new Map(existing.map((e) => [keyOf(e), { metrics: (e.metrics ?? {}) as SignalMetrics, lastSeenAt: e.lastSeenAt }]));
    await Promise.all(
      chunk.map((s) => {
        const metrics = { ...withVelocity(s.metrics, seen.get(keyOf(s)), now) };
        return prisma.signal.upsert({
          where: { source_externalId: { source: s.source, externalId: s.externalId } },
          create: { ...s, metrics, firstSeenAt: now, lastSeenAt: now },
          update: { title: s.title, url: s.url, metrics, lastSeenAt: now },
        });
      }),
    );
  }
  return signals.length;
}
