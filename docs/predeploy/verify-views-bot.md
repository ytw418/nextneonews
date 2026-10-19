# 검증 — 조회 수 API 봇 거르기·횟수 제한 없음 (qa-edge.md 6번)

검증일 2026-10-20 · 대상 http://localhost:3400 (`/private/tmp/unnie-final`, 커밋 `1bb6006`, 로컬 DB `localhost:54329`) · 코드는 고치지 않음

## 결론

| 항목 | 판정 |
|---|---|
| 재현 | **된다.** 봇 UA로 5번 보내니 로컬 DB의 조회 수가 정확히 5 올랐다 |
| 설계상 의도인가 | 아니다. 문서(`docs/monetize/*`)에 '조회 수는 봇을 거르지 않는다'는 결정이 없다. 코드 주석은 클라이언트 쪽 중복 막기(세션마다 글당 1번)만 믿고 있다 |
| 운영에도 있나 | 있다. 같은 코드가 `origin/main`(커밋 `f10e30f`, 10-16)부터 운영에 나가 있다. **내일 배포로 새로 생기는 문제가 아니다** |
| 심각도 | QA 보고는 '중간'이지만 **'낮음'** 으로 낮춘다(이유는 아래). 배포를 막을 일은 아니다 |

## 재현 근거

| # | 명령 | 결과 |
|---|---|---|
| 1 | `curl -X POST -A 'python-requests/2.32' localhost:3400/api/views/cmv9przt90001n7f8vbkdw9fc` ×10 | 모두 204 |
| 2 | 같은 요청 ×5, 앞뒤로 `select views from "Article" where id='cmv9…'` | before=28 → after=33, **delta=5** (보낸 만큼 그대로 오름) |
| 3 | UA 없이(`-H 'User-Agent:'`) 1번 | 204, 역시 올라감 |
| 4 | 없는 id(`/api/views/doesnotexist`) | 204 — 글이 없어도 UPDATE 를 한 번 실행한다(DB 접속 1회) |
| 5 | 같은 UA로 `POST /api/reactions/cmv9…` `{"type":"love"}` | **403 `{"error":"bot"}`** — 반응·투표·응원은 막는다 |
| 6 | Vercel 방화벽 설정 조회(`get_firewall_config active`, 프로젝트 `hallyu-brief`) | 404 'config not found' — 운영에 WAF 규칙(횟수 제한 포함)이 하나도 없다 |

## 코드 근거

| 위치 | 내용 |
|---|---|
| `apps/web/src/app/api/views/[id]/route.ts:5-8` | UA·IP를 보지 않고 바로 `UPDATE "Article" SET views = views + 1` 후 204 |
| `apps/web/src/components/ViewPing.tsx:30-40` | 중복 막기는 브라우저 `sessionStorage` 뿐. 스크립트는 이것을 거치지 않는다 |
| `apps/web/src/lib/voter.ts:20-25` | `isBot` 이 이미 있다(`/bot\|crawler\|spider\|curl\|python/i`, UA 없으면 봇) |
| `apps/web/src/lib/engagement.ts:123-124, 160-161`, `item-votes.ts:143-144`, `api/cheer/[entityId]/route.ts:18-19` | 다른 쓰기 API는 모두 `isBot` → 403, 그리고 `rateLimited`(ipHash 시간당 N회) |
| `apps/web/src/lib/articles.ts:115-125` (`listPopular`) | 최근 N일·`views > 0` 글을 views 내림차순. 홈 `TrendingNow.tsx:9`(5개), `home/PopularChips.tsx:14`(2일·6개), 글 상세 `news/[slug]/page.tsx:138`, `engagement.ts:276,287`(다음 글 순서)에 쓰인다 |

## '중간'이 아니라 '낮음'으로 보는 이유

| 보고서 주장 | 확인한 사실 |
|---|---|
| 인기 순위 조작 | 맞다. 운영 30일 PV가 129건(`cost.md:48`)이라 수십 번만 보내면 아무 글이나 '이번 주 인기' 1위가 된다. 다만 바뀌는 것은 **우리 글끼리의 순서**뿐이다. 외부 내용이 끼어들거나 돈·개인정보가 걸린 것이 아니다 |
| 봇이 Neon을 깨워 한도를 쓴다 | 경로는 있지만 비중이 작다. 운영 로그(최근 5시간, `requestPath` 묶음) 상위 25개는 모두 페이지 ISR 재생성이고 `/api/views` 는 검색해도 0건이다. DB 한도 초과의 원인은 봇 ISR 재생성이다(`cost.md:7, 47`). 또 악의적 스크립트라면 `GET /api/comments`(no-store)나 아무 ISR 페이지로도 똑같이 DB를 깨운다 |
| `isBot` 이면 204 | 정직한 크롤러·순진한 스크립트만 막는다. UA 한 줄만 바꾸면 우회된다. 조작을 실제로 막는 것은 횟수 제한이다 |
| 기존 운영 코드 | 10-16부터 운영에 있었고 오늘 작업과 무관하다 |

## 고치는 방법 (참고 — 이번 점검에서는 고치지 않음)

| 안 | 내용 | 품 | 비고 |
|---|---|---|---|
| A (권장, 최소) | `route.ts` 맨 앞에서 `isBot(request.headers.get("user-agent"))` 이면 쓰지 않고 204. id가 cuid 모양이 아니면 DB를 부르지 않고 204(`%00` 500 문제 qa-edge 10번도 함께 해결) | S | 다른 쓰기 API와 규칙이 같아진다. 우회는 가능 |
| B | Vercel 방화벽에 `POST /api/*` IP당 분당 30회 정도 횟수 제한 규칙 1개 | S(대시보드) | 지금 규칙이 0개다. Pro 요금에 포함되는 양은 대시보드에서 확인 후 결정 |
| C | `cost.md` F안 — `/api/views` 를 없애고 인기 글을 PostHog 조회 수로 하루 1번 계산 | S~M | 조작·DB 깨움을 함께 없앤다. 인기 순위가 하루 늦어진다 |

## 남긴 흔적

- 로컬 DB 글 `cmv9przt90001n7f8vbkdw9fc` 조회 수를 내가 16 올렸다(첫 10회 + UA 없음 1회 + 측정 5회). 운영 DB는 건드리지 않았다(꺼져 있음).
