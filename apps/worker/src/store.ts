import { prisma } from "@kmedia/db";

import type { CollectedSignal } from "./collectors/types";

// 같은 글은 (source, externalId) 로 한 줄만 두고, 다시 보이면 제목·숫자·lastSeenAt 을 갱신한다.
export async function upsertSignals(signals: CollectedSignal[]): Promise<number> {
  const now = new Date();
  await prisma.$transaction(
    signals.map((s) =>
      prisma.signal.upsert({
        where: { source_externalId: { source: s.source, externalId: s.externalId } },
        create: { ...s, metrics: { ...s.metrics }, firstSeenAt: now, lastSeenAt: now },
        update: { title: s.title, url: s.url, metrics: { ...s.metrics }, lastSeenAt: now },
      }),
    ),
  );
  return signals.length;
}
