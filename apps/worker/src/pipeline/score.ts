import { z } from "zod";

import { ArticleFormat, Category, prisma, type Signal } from "@kmedia/db";

import { callStructured } from "../ai/client";
import { MODELS } from "../ai/models";
import { SCORE_SYSTEM } from "../ai/prompts";
import type { SignalMetrics } from "../collectors/types";
import { log } from "../log";
import { ruleFilter } from "./ruleFilter";

const BATCH_SIZE = 25;
const LOOKBACK_HOURS = 48;
// 이 점수 이상이고 answerable 2 이상, RED 아님, 중복 아님 → Topic 큐에 올린다 (최대 27점).
// 케이아지트 수준으로 너그럽게: 연예 가십·반응형도 통과시킨다
const TOPIC_THRESHOLD = 14;
const MIN_ANSWERABLE = 2;

const ScoreItem = z.object({
  id: z.string(),
  keyword: z.string(),
  foreignInterest: z.number().int().describe("1-5"),
  answerable: z.number().int().describe("1-5"),
  timeliness: z.number().int().describe("1-5"),
  evergreen: z.number().int().describe("1-5"),
  risk: z.enum(["GREEN", "YELLOW", "RED"]),
  category: z.enum(Category),
  format: z.enum(ArticleFormat),
  locales: z.array(z.enum(["en", "ja", "zh-TW"])),
  duplicateOf: z.string().nullable(),
  reason: z.string(),
});
const ScoreResult = z.object({ items: z.array(ScoreItem) });
type ScoreItem = z.infer<typeof ScoreItem>;

const clamp = (n: number) => Math.min(5, Math.max(1, Math.round(n)));

function engagementBonus(metrics: SignalMetrics): number {
  const rank = metrics.rank ?? Infinity;
  if (rank <= 5) return 2;
  if (rank <= 15) return 1;
  return 0;
}

// docs/production.md ①: 해외관심×2 + 답변가능×2 + max(시의성, 에버그린) + 반응 보정
export function totalScore(item: ScoreItem, metrics: SignalMetrics): number {
  return (
    clamp(item.foreignInterest) * 2 +
    clamp(item.answerable) * 2 +
    Math.max(clamp(item.timeliness), clamp(item.evergreen)) +
    engagementBonus(metrics)
  );
}

function metricsOf(signal: Signal): SignalMetrics {
  return (signal.metrics ?? {}) as SignalMetrics;
}

const OPEN_STATUSES = ["NEW", "QUEUED"] as const;

async function openTopics() {
  return prisma.topic.findMany({
    where: { status: { in: [...OPEN_STATUSES] } },
    select: { id: true, keyword: true },
  });
}

async function queueTopic(signal: { id: string }, item: ScoreItem, score: number) {
  // 같은 키워드의 진행 중 주제가 있으면 거기에 붙인다
  const existing = await prisma.topic.findFirst({
    where: { keyword: item.keyword, status: { in: [...OPEN_STATUSES] } },
  });
  const topic =
    existing ??
    (await prisma.topic.create({
      data: {
        keyword: item.keyword,
        score,
        riskTier: item.risk,
        status: "QUEUED",
        category: item.category,
        format: item.format,
        locales: item.locales,
        brief: item.reason,
      },
    }));
  await prisma.signal.update({ where: { id: signal.id }, data: { topicId: topic.id } });
}

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
  const { passed, rejected } = ruleFilter(
    signals.map((s) => ({ ...s, metrics: metricsOf(s) })),
  );
  for (const { item, reason } of rejected) {
    await prisma.signal.update({
      where: { id: item.id },
      data: { qualityScore: 0, qualityNote: `rule:${reason}`, checkedAt: now },
    });
  }
  log.info("score: rule filter", { passed: passed.length, rejected: rejected.length });

  let queued = 0;
  for (let i = 0; i < passed.length; i += BATCH_SIZE) {
    const batch = passed.slice(i, i + BATCH_SIZE);
    // 앞 묶음에서 만든 주제까지 넘겨야 묶음을 넘나드는 중복을 잡는다
    const existingTopics = await openTopics();
    const topicIds = new Set(existingTopics.map((t) => t.id));
    const items = batch.map((s) => ({ id: s.id, source: s.source, title: s.title, metrics: s.metrics }));
    const result = await callStructured({
      task: "score",
      model: MODELS.score,
      system: SCORE_SYSTEM,
      user: JSON.stringify({ existingTopics, items }),
      schema: ScoreResult,
      effort: "low",
    });

    const byId = new Map(result.items.map((item) => [item.id, item]));
    for (const signal of batch) {
      const item = byId.get(signal.id);
      if (!item) {
        log.warn("score: item missing from response", { id: signal.id });
        continue;
      }
      const score = totalScore(item, signal.metrics);
      // 이미 있는 주제와 같은 사건이면 새 주제를 만들지 않고 신호만 그 주제에 붙인다
      if (item.duplicateOf && topicIds.has(item.duplicateOf)) {
        await prisma.signal.update({
          where: { id: signal.id },
          data: {
            qualityScore: score,
            qualityNote: `dup ${item.reason}`,
            checkedAt: now,
            topicId: item.duplicateOf,
          },
        });
        continue;
      }
      const eligible =
        score >= TOPIC_THRESHOLD &&
        clamp(item.answerable) >= MIN_ANSWERABLE &&
        item.risk !== "RED" &&
        item.duplicateOf === null;

      await prisma.signal.update({
        where: { id: signal.id },
        data: { qualityScore: score, qualityNote: `${item.risk} ${item.reason}`, checkedAt: now },
      });
      if (eligible) {
        await queueTopic(signal, item, score);
        queued += 1;
      }
    }
  }

  log.info("score: done", { checked: signals.length, queued });
  return { checked: signals.length, queued };
}
