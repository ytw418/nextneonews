import "./env";

import { prisma } from "@kmedia/db";

import { budgetUsd, spentUsd } from "./ai/budget";
import { collectors } from "./collectors";
import { isSeedSource, SEED_SOURCES, seedTopic } from "./collectors/manualSeed";
import { buildEntities } from "./entities/build";
import { backfillCredits, backfillImages, recheckImages } from "./entities/images";
import { geoCheck } from "./geo/check";
import { log } from "./log";
import { backfillPolls } from "./pipeline/backfillPolls";
import { fixIndexable } from "./pipeline/indexable";
import { listReview, publish } from "./pipeline/publish";
import { listHiddenComments, restoreComments } from "./pipeline/comments";
import { seedGuides } from "./pipeline/guides";
import { recategorize } from "./pipeline/recategorize";
import { recheckSources } from "./pipeline/recheck";
import { isRefreshSet, REFRESH_SETS, refreshSite } from "./pipeline/refresh";
import { collectProducts } from "./products";
import { ensureWeeklyPoll, runRankings, syncEntityMeta, syncWiki } from "./rankings";
import { backfillSimplified } from "./pipeline/simplified";
import { scoreSignals } from "./pipeline/score";
import { unpublish } from "./pipeline/unpublish";
import { collectTranslations, submitTranslations } from "./pipeline/translate";
import { writeArticles } from "./pipeline/write";
import { upsertSignals } from "./store";

async function collect(names: string[]) {
  const targets = names.length > 0 ? names : Object.keys(collectors);

  // 한 곳이 막혀도(예: 더쿠가 데이터센터 IP 를 403) 나머지로 계속한다. 전부 실패했을 때만 실패로 본다
  let failed = 0;
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
      failed += 1;
      log.warn(`collector failed: ${name}`, { error: String(error) });
    }
  }
  if (failed === targets.length) process.exitCode = 1;
}

function numberArg(args: string[], fallback: number): number {
  const n = Number(args[0]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

// `--name 값` 꼴의 옵션 값
function flagValue(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

// refresh date day … — 정한 묶음의 사이트 화면을 비우고 미리 요청한다 (pipeline.yml 이 날짜 키로 정해 부른다)
async function refreshCommand(args: string[]) {
  const sets = args.filter(isRefreshSet);
  if (sets.length === 0 || sets.length !== args.length) {
    log.error(`usage: refresh <${REFRESH_SETS.join("|")}>...`, { given: args });
    process.exitCode = 1;
    return;
  }
  await refreshSite(sets);
}

async function seedTopicCommand(args: string[]) {
  const title = args[0]?.trim();
  const source = flagValue(args, "--source");
  if (!title || title.startsWith("--") || !source || !isSeedSource(source)) {
    log.error(`usage: seed-topic "<제목>" --source ${SEED_SOURCES.join("|")} [--url <원문 주소>]`);
    process.exitCode = 1;
    return;
  }
  await seedTopic(title, { source, url: flagValue(args, "--url") });
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
  images [credits|recheck] 대표 사진 붙이기 / credits: 라이선스·원본 링크 채우기 / recheck: 주인공이 아닌 사진 떼기 (무료)
  zh-cn                    간체 번역 없는 글에 번체→간체 변환으로 채우기 (무료)
  translate [limit]        끝난 번역 배치 거두기 + vi·id·fr·ru 가 빠진 글을 배치로 보내기 (50% 할인, 0 이면 거두기만)
  recategorize             분류 규칙을 바꾼 뒤 기존 글 카테고리 다시 매기기
  comments [restore id…]   신고로 숨겨진 댓글 보기 / 되살리기
  seed-guides              가이드 주제(apps/worker/data/guides.json)를 대기열에 넣기 (이미 있으면 건너뜀)
  recheck                  최근 30일 글의 원문이 삭제됐으면(404·410) 글을 내려 확인 대기로 (하루 1번)
  unpublish <id|slug|끝6자리…> [--dry] | unpublish --off-topic [--dry]
                           발행 글 내리기 (REJECTED). --off-topic: 무관 주제 단어(해외 축구·코인·처형)가 제목에 있는 글
  products                 편의점 상품 수집 (K-쇼핑 주간 랭킹, 하루 1번)
  rankings                 오늘(KST) 랭킹 스냅숏 만들기 (AI 없음, 하루 1번)
  wiki-sync [--backfill]   위키백과 언어별 조회수 수집 (--backfill: 90일치)
  entity-meta              인물 페이지 주소·대표 사진 CC 표기 채우기 (주 1회)
  weekly-poll              이번 주 팬 투표 열기 + 지난주 결과 남기기 (월요일 00시 KST)
  backfill-polls [n]       최근 글 중 투표가 없는 글에 투표 붙이기 (AI, 기본 150개)
  fix-indexable            언어·분류별 색인 규칙을 기존 번역에 다시 적용
  refresh <${REFRESH_SETS.join("|")}>...
                           사이트 화면 비우고 미리 요청 (date: 날짜가 바뀐 뒤 D-day, day: 랭킹 뒤 하루 1번,
                           week: 쪽 번호 화면, deploy: 운영 배포 직후 글·인물 화면)
  seed-topic "<제목>" --source ${SEED_SOURCES.join("|")} [--url <주소>]
                           자동 수집하지 않는 커뮤니티 주제를 사람이 씨앗으로 넣기`;

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
    case "products":
      await collectProducts();
      break;
    case "rankings":
      await runRankings();
      break;
    case "wiki-sync":
      await syncWiki({ backfill: args.includes("--backfill") });
      break;
    case "entity-meta":
      await syncEntityMeta();
      break;
    case "weekly-poll":
      await ensureWeeklyPoll();
      break;
    case "backfill-polls":
      await backfillPolls(numberArg(args, 150));
      break;
    case "fix-indexable":
      await fixIndexable();
      break;
    case "seed-topic":
      await seedTopicCommand(args);
      break;
    case "recheck":
      await recheckSources();
      break;
    case "refresh":
      await refreshCommand(args);
      break;
    case "unpublish":
      await unpublish(args);
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
      else if (args[0] === "recheck") await recheckImages();
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
