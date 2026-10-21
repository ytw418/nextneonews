import { prisma, type Signal } from "@kmedia/db";

import type { SignalMetrics } from "../collectors/types";
import { findEntities } from "../entities/match";
import { log } from "../log";
import { evaluate, type HeuristicResult, totalScore } from "./heuristics";
import { ruleFilter } from "./ruleFilter";

const LOOKBACK_HOURS = 48;
// 이 점수 이상이고 answerable 2 이상이면 Topic 큐에 올린다 (최대 27점). 케이아지트 수준으로 너그럽게
const TOPIC_THRESHOLD = 16;
const MIN_ANSWERABLE = 2;

const OPEN_STATUSES = ["NEW", "QUEUED"] as const;

function metricsOf(signal: Signal): SignalMetrics {
  return (signal.metrics ?? {}) as SignalMetrics;
}

async function queueTopic(signalId: string, r: HeuristicResult, score: number): Promise<boolean> {
  // 같은 인물(키워드)의 진행 중 주제가 있으면 거기에 붙인다
  const existing = await prisma.topic.findFirst({
    where: { keyword: r.keyword, status: { in: [...OPEN_STATUSES] } },
  });
  const topic =
    existing ??
    (await prisma.topic.create({
      data: {
        keyword: r.keyword,
        score,
        riskTier: r.risk,
        status: "QUEUED",
        category: r.category,
        format: r.format,
        locales: ["en", "ja", "zh-TW"],
        brief: r.reason,
      },
    }));
  await prisma.signal.update({ where: { id: signalId }, data: { topicId: topic.id } });
  return Boolean(existing);
}

// 품질 체크: 1단계 규칙 필터 + 2단계 알고리즘 채점. AI 호출 없음 (docs/production.md ①)
export async function scoreSignals(limit = 200): Promise<{ checked: number; queued: number }> {
  const since = new Date(Date.now() - LOOKBACK_HOURS * 3600_000);
  const signals = await prisma.signal.findMany({
    where: { checkedAt: null, lastSeenAt: { gte: since } },
    orderBy: { lastSeenAt: "desc" },
    take: limit,
  });
  if (signals.length === 0) {
    log.info("score: nothing to check");
    return { checked: 0, queued: 0 };
  }

  const now = new Date();
  const { passed, rejected } = ruleFilter(signals.map((s) => ({ ...s, metrics: metricsOf(s) })));
  for (const { item, reason } of rejected) {
    await prisma.signal.update({
      where: { id: item.id },
      data: { qualityScore: 0, qualityNote: `rule:${reason}`, checkedAt: now },
    });
  }

  // 점수 높은 것부터 넣어야 같은 인물 주제의 대표 점수가 높은 글로 잡힌다
  const evaluated = await Promise.all(
    passed.map(async (signal) => {
      const result = evaluate(signal, await findEntities(signal.title));
      return { signal, result, score: totalScore(result, signal.metrics) };
    }),
  );
  evaluated.sort((a, b) => b.score - a.score);

  let queued = 0;
  let merged = 0;
  for (const { signal, result, score } of evaluated) {
    await prisma.signal.update({
      where: { id: signal.id },
      data: { qualityScore: score, qualityNote: `${result.risk} ${result.reason}`, checkedAt: now },
    });
    // 사람이 seed-topic 으로 넣은 주제는 점수와 상관없이 쓴다 (사전에 없는 신인 그룹 등)
    const seeded = signal.source.startsWith("manual-");
    if (seeded || (result.relevant && score >= TOPIC_THRESHOLD && result.answerable >= MIN_ANSWERABLE)) {
      if (await queueTopic(signal.id, result, score)) merged += 1;
      else queued += 1;
    }
  }

  log.info("score: done", { checked: signals.length, rejected: rejected.length, queued, merged });
  return { checked: signals.length, queued };
}
