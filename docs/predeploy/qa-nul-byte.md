# 널 문자(%00) 500 버그 — 검증 결과

검증일 2026-10-20 · 대상: 로컬 운영 빌드 `http://localhost:3400`(`/private/tmp/unnie-final`, 커밋 1bb6006) + 운영 `https://unnienote.app`(읽기·거부되는 요청만) · 코드 수정 없음

## 결론

| 항목 | 판정 |
|---|---|
| 보고된 경로형(`/api/views/a%00b`, `/en/news/a%00b`, `/en/idol/a%00b` 등 주소 **경로**에 `%00`) | **운영과 무관.** Vercel 엣지가 함수 앞에서 `400 BAD_REQUEST` 로 막는다. 로컬 `next start` 에서만 500 |
| 쿼리·본문형(`/api/comments?articleId=a%00b`, `POST /api/comments` JSON 의 `\u0000`) | **운영에서도 재현.** 엣지가 통과시키고 함수가 Postgres 오류 22021 로 500 |
| 심각도 | 낮음 — 내부 정보 노출 없음, 데이터 안 써짐. 함수 오류 로그만 쌓인다. 배포를 막을 일은 아님 |
| 제안된 수정(모든 경로 id·slug 에 `isSafeId()`) | 범위가 너무 넓다. 실제로 필요한 곳은 댓글 API 의 `articleId`·`body`·`nickname` 세 칸뿐 |

## 재현 기록

### 로컬(`localhost:3400`)

| 요청 | 결과 | 비교(널 문자 없음) |
|---|---|---|
| `curl -X POST /api/views/a%00b` | 500, 빈 본문 | — |
| `GET /api/comments?articleId=a%00b` | 500, 빈 본문 | `?articleId=ab` → 200 `{"comments":[],"total":0}` |
| `GET /en/news/a%00b` | 500 (`__next_error__` 화면) | `/en/news/ab` → 404 |
| `GET /en/idol/a%00b` | 500 | `/en/idol/ab` → 404 |
| `POST /api/comments` `{"articleId":"a\u0000b",…}` | 500 | `"articleId":"ab"` → 404 `{"error":"notFound"}` |
| `POST /api/comments` 실제 글 id + `"body":"qa\u0000test"` | 500 (댓글 안 생김) | — |
| `GET /api/saved?locale=en&items=beauty:a%00b` | 200 `{"items":[]}` — 안전 | — |
| `GET /api/feed?locale=en&cursor=a%00b` | 400 — 안전 | — |

원인(서버 로그 `/private/tmp/unnie-final-start.log:675` 외 다수):
`PrismaClientKnownRequestError P2039 … Database error. Code: 22021. invalid byte sequence for encoding "UTF8": 0x00`
— Postgres 는 text 칸에 0x00 을 받지 않는다. 운영 Neon 도 Postgres 라 같은 오류가 난다.

### 운영(`unnienote.app`)

| 요청 | 결과 | 의미 |
|---|---|---|
| `GET /en/news/a%00b` | 400, `x-vercel-error: BAD_REQUEST`, 본문 `Bad request … icn1::…` | 엣지가 차단, 함수 실행 안 됨 |
| `GET /en/idol/a%00b` | 400 BAD_REQUEST | 동일 |
| `POST /api/views/a%00b` | 400 BAD_REQUEST | 동일 (보고서의 대표 재현이 운영에선 안 됨) |
| `GET /a%00b`, `GET /robots.txt%00` | 400 BAD_REQUEST | 경로의 `%00` 은 전부 엣지에서 거부 |
| `GET /robots.txt?x=a%00b` | 200 (cache HIT) | **쿼리의 `%00` 은 엣지가 통과시킨다** |
| `GET /api/comments?articleId=a%00b` | 500, `x-vercel-error` 없음 | 함수까지 도달. 단, 지금은 운영 DB 한도 초과로 `?articleId=ab` 도 500 이라 운영에서 원인만 따로 가르지는 못함. 코드·DB 종류가 같아 DB 복구 뒤에도 500 으로 판단 |

따라서 보고서 `where` 목록 중 `api/views/[id]`, `api/comments/[id]`(PATCH·DELETE)·`report`, `api/reactions/[id]`, `api/cheer/[entityId]`, `api/polls/[id]/vote`, `api/next`·`api/article`, `news/[slug]`, `idol/[slug]` 의 **경로 id** 는 운영에서 함수에 닿지 않는다.

## 운영에서 실제로 닿는 곳(코드 근거)

| 위치 | 입력 | 검사 | 결과 |
|---|---|---|---|
| `apps/web/src/app/api/comments/route.ts:9-11` | 쿼리 `articleId` | 빈 값만 거름 | `listComments` → `src/lib/comments.ts:109-110` findMany·count 에서 22021 → 500 |
| `apps/web/src/lib/comments.ts:61` → `:122` | 본문 `articleId` | `z.string().min(1).max(40)` 뿐 | `article.findFirst` 에서 500 |
| `apps/web/src/lib/comments.ts:63,65` → `:143-150` | 본문 `nickname`·`body` | 길이·링크만 검사 | `comment.create` 에서 500 (트랜잭션이라 써지는 것 없음) |
| `apps/web/src/lib/comments.ts:70` (EditInput) → `:181` | PATCH 본문 `body` | 길이만 | 비밀번호가 맞은 뒤 update 에서 500 (경로 id 는 정상일 때) |
| `apps/web/src/lib/engagement.ts:128` | 투표 본문 `option` | `poll.optionIds.includes()` 로 JS 에서 먼저 거름 | 안전 |
| `apps/web/src/app/api/items/[kind]/[itemId]/vote/route.ts:12` | 경로·본문 | `isItemId`·`isValidVote` | 안전 |

## 보고서의 '얻는 것' 재평가

| 보고서 주장 | 검증 |
|---|---|
| 스캐너가 함수 오류 로그를 채우지 못한다 | 맞다. 다만 운영에선 쿼리·본문형만 해당 |
| 캐시되지 않는 500 요청이 DB 를 깨우는 일이 없어진다 | 약하다. 모양만 맞는 없는 id(`?articleId=ab`)도 `no-store` 로 DB 를 부른다. 널 문자 검사로 DB 호출 횟수는 사실상 줄지 않는다 |

## 권장 수정(배포 뒤 해도 됨, 15분 안쪽)

| 바꿀 곳 | 내용 |
|---|---|
| `src/lib/comments.ts:61` | `articleId` 를 글 id 모양(cuid, 예 `cmv97tfnc0004y2f8ynvudg58`)으로 `regex` 검사 → 틀리면 기존 `400 invalid` |
| `src/app/api/comments/route.ts:9-10` | GET 도 같은 스키마로 `articleId` 검사 → 400 |
| `src/lib/comments.ts:63,65,70` | `nickname`·`body` 에 `.refine(s => !s.includes("\u0000"))`(또는 transform 으로 제거) |
| 하지 않을 것 | 모든 라우트·페이지에 `isSafeId()` 일괄 추가 — 경로형은 Vercel 이 이미 막는다 |

테스트: 분기 로직이 아니라 입력 스키마 한 줄이라 새 테스트는 필요 없다(기존 댓글 테스트가 있으면 그대로 통과 확인).
