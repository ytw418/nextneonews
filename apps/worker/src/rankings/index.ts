// 매일 랭킹 (packages/core/src/rankings.ts). AI 를 쓰지 않고 숫자로만 계산한다.
// 재료: metrics.ts(국내 화제 — 더쿠·구글 트렌드·연합) + wiki.ts(세계 관심 — 위키백과 8개 언어 조회수)
// 계산: score.ts(순수 함수) → 저장: snapshot.ts. 주간 팬 투표는 weeklyPoll.ts, 인물 페이지 정보는 entityMeta.ts

// 오늘(KST) 랭킹 스냅숏 만들기. 지난주 고정판이 없으면 함께 남긴다
export { runRankings } from "./snapshot";

// 위키백과 문서 제목·언어별 조회수 → EntityMetric('wiki:{lang}'). backfill 이면 90일치
export { syncWiki } from "./wiki";

// 인물 페이지 slug·대표 사진 CC 표기·사진 크기 채우기 (주 1회)
export { syncEntityMeta } from "./entityMeta";

// 이번 주 팬 투표 열기 + 지난주 투표 닫고 결과 남기기 (월요일 00시 KST)
export { ensureWeeklyPoll } from "./weeklyPoll";
