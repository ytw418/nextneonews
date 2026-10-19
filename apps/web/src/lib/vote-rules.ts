// 평가 요약(평균·'건성 92%가 인생템'·구조화 데이터 별점)을 보이는 최소 표 수. 1~2표 요약은 과장이라 이만큼 모인 뒤에만 보인다
export const MIN_VOTES_FOR_SUMMARY = 5;

// 집계 묶음 조회(GET /api/items/{kind}?ids=…) 한 번에 받는 항목 수. 뷰티 카탈로그 한 섹션(50개)이 한 요청에 든다.
// 서버(라우트)와 화면(ItemVote.tsx — 넘으면 나눠 보낸다)이 같은 값을 쓴다
export const ITEMS_BATCH_MAX = 60;
