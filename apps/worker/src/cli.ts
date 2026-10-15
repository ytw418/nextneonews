import "./env";

import { prisma } from "@kmedia/db";

import { budgetUsd, spentUsd } from "./ai/budget";
import { collectors } from "./collectors";
import { buildEntities } from "./entities/build";
import { backfillCredits, backfillImages } from "./entities/images";
import { geoCheck } from "./geo/check";
import { log } from "./log";
import { listReview, publish } from "./pipeline/publish";
import { listHiddenComments, restoreComments } from "./pipeline/comments";
import { seedGuides } from "./pipeline/guides";
import { recategorize } from "./pipeline/recategorize";
import { backfillSimplified } from "./pipeline/simplified";
import { scoreSignals } from "./pipeline/score";
import { collectTranslations, submitTranslations } from "./pipeline/translate";
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
  cost                     AI 누적 비용 / 상한
  geo-check [limit]        목표 질문을 AI 웹 검색에 던져 인용 출처 기록 (GEO 측정)
  entities                 위키데이터에서 인물·그룹·드라마 사전 갱신 (무료, 주 1회)
  images [credits]         대표 사진 없는 글에 위키미디어 공용 사진 붙이기 / credits: 라이선스·원본 링크 채우기 (무료)
  zh-cn                    간체 번역 없는 글에 번체→간체 변환으로 채우기 (무료)
  translate [limit]        끝난 번역 배치 거두기 + vi·id·fr·ru 가 빠진 글을 배치로 보내기 (50% 할인, 0 이면 거두기만)
  recategorize             분류 규칙을 바꾼 뒤 기존 글 카테고리 다시 매기기
  comments [restore id…]   신고로 숨겨진 댓글 보기 / 되살리기
  seed-guides              가이드 주제(apps/worker/data/guides.json)를 대기열에 넣기 (이미 있으면 건너뜀)`;

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
    case "seed-guides":
      await seedGuides();
      break;
    case "comments":
      if (args[0] === "restore") await restoreComments(args.slice(1));
      else await listHiddenComments();
      break;
    case "recategorize":
      await recategorize();
      break;
    case "translate": {
      const saved = await collectTranslations();
      // `translate 0` 은 거두기만 한다
      const submitted = args[0] === "0" ? 0 : await submitTranslations(numberArg(args, 200));
      log.info("translate: done", { saved, submitted });
      break;
    }
    case "zh-cn":
      await backfillSimplified();
      break;
    case "images":
      if (args[0] === "credits") await backfillCredits();
      else await backfillImages();
      break;
    case "entities":
      await buildEntities();
      break;
    case "geo-check":
      await geoCheck(numberArg(args, 8));
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
