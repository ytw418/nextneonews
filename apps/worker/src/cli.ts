import "./env";

import { prisma } from "@kmedia/db";

import { budgetUsd, spentUsd } from "./ai/budget";
import { collectors } from "./collectors";
import { log } from "./log";
import { listReview, publish } from "./pipeline/publish";
import { scoreSignals } from "./pipeline/score";
import { writeArticles } from "./pipeline/write";
import { upsertSignals } from "./store";

async function collect(names: string[]) {
  const targets = names.length > 0 ? names : Object.keys(collectors);

  for (const name of targets) {
    const collector = collectors[name];
    if (!collector) {
      log.error(`unknown collector: ${name}`, { available: Object.keys(collectors) });
      process.exitCode = 1;
      continue;
    }
    try {
      const signals = await collector.collect();
      const saved = await upsertSignals(signals);
      log.info(`collected ${name}`, { saved });
    } catch (error) {
      log.error(`collector failed: ${name}`, { error: String(error) });
      process.exitCode = 1;
    }
  }
}

function numberArg(args: string[], fallback: number): number {
  const n = Number(args[0]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

const USAGE = `usage: cli.ts <command>
  collect [collector...]   수집 (${Object.keys(collectors).join(", ")})
  check [limit]            품질 체크: 규칙 필터 + AI 채점 → Topic 큐
  write [limit]            큐 상위 주제로 글 작성 + 현지화 (상태 REVIEW)
  pipeline [limit]         collect → check → write
  review                   승인 대기 글 목록
  publish [articleId...]   승인 (id 없으면 REVIEW 전부)
  cost                     AI 누적 비용 / 상한`;

const [command, ...args] = process.argv.slice(2);

try {
  switch (command) {
    case "collect":
      await collect(args);
      break;
    case "check":
      await scoreSignals(numberArg(args, 200));
      break;
    case "write":
      await writeArticles(numberArg(args, 3));
      break;
    case "pipeline":
      await collect([]);
      await scoreSignals();
      await writeArticles(numberArg(args, 3));
      break;
    case "review":
      await listReview();
      break;
    case "publish":
      await publish(args);
      break;
    case "cost": {
      const spent = await spentUsd();
      const limit = budgetUsd();
      log.info(`AI cost $${spent.toFixed(4)} / limit $${limit.toFixed(2)} (${((spent / limit) * 100).toFixed(1)}%)`);
      break;
    }
    default:
      console.error(USAGE);
      process.exitCode = 1;
  }
} catch (error) {
  log.error(String(error));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
