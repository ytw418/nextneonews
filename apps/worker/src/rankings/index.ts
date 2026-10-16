import { log } from "../log";

// 매일 랭킹 (packages/core/src/rankings.ts). AI 를 쓰지 않고 숫자로만 계산한다.
// 지금은 CLI 자리만 잡아 둔 것이다 — 실제 계산은 wiki.ts·metrics.ts·score.ts·snapshot.ts 로 채운다

// 오늘(KST) 랭킹 스냅숏 만들기. 월요일에는 지난주 고정판도 남긴다
export async function runRankings(): Promise<void> {
  log.info("rankings: not implemented");
}

// 위키백과 문서 제목·언어별 조회수 → EntityMetric('wiki:{lang}'). backfill 이면 90일치
export async function syncWiki(_options: { backfill: boolean }): Promise<void> {
  log.info("wiki-sync: not implemented");
}

// 인물 페이지 slug·대표 사진 CC 표기·사진 크기 채우기 (주 1회)
export async function syncEntityMeta(): Promise<void> {
  log.info("entity-meta: not implemented");
}

// 이번 주 팬 투표 열기 + 지난주 투표 닫고 결과 남기기 (월요일 00시 KST)
export async function ensureWeeklyPoll(): Promise<void> {
  log.info("weekly-poll: not implemented");
}
