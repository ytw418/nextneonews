# 검증 — Neon 한도 초과(53000→P2039)를 'DB 없음'으로 못 알아보는 문제

2026-10-20 00:08 KST. 검증 대상은 `docs/predeploy/qa-edge.md` 3번 항목이다. 코드는 고치지 않았다.

## 결론

| 항목 | 판정 |
|---|---|
| 버그가 있는가 | **있다.** 운영에서 실제로 나는 오류는 `P2039`(원인 53000)다. `isDbUnavailable` 은 이 오류를 false 로 판정한다 |
| 설계 의도인가 | 아니다. `docs/monetize/PLAN.md:174`·`:179` 에 정해 둔 동작은 "DB 불통이면 0표 집계·503"이다. 지금 한도 초과에서는 500 이 나간다 |
| 심각도 | **낮음**(QA 는 '중간'으로 냈다). 사용자 화면은 500 이든 503 이든 똑같다. 그리고 QA 가 말한 이득, 즉 "장애 중에도 가이드 화면을 재생성할 수 있다"는 **틀렸다** |
| 배포를 막는가 | 막지 않는다 |

## 재현 (http://localhost:3400 과 같은 빌드 `1bb6006`, `/private/tmp/unnie-final`)

`/tmp/qa-edge/sim/fakepg.py 55433` 로 SQLSTATE 53000 을 돌려주는 가짜 Postgres 를 띄웠다. 그다음 같은 `.next` 로 `next start` 를 3411·3412 포트에 따로 띄웠다(3400 은 건드리지 않았다).

| 조건 | 요청 | 결과 |
|---|---|---|
| 정상(3400, 로컬 DB) | `GET /api/items/drama/queen-of-tears` | 200 `{"total":14,…}` |
| **53000**(3411 → 가짜 DB) | `GET /api/items/drama/queen-of-tears` | **500** |
| **53000** | `POST …/queen-of-tears/vote` `{"choice":"5","locale":"en"}` | **500** |
| 닫힌 포트(3412) | 같은 GET | 200, 0표 집계 |
| 닫힌 포트 | 같은 POST | 503 `{"error":"unavailable"}` |
| 53000, 실제 `isDbUnavailable` 함수 | `tsx /tmp/verify-p2039/probe.mts` | `PrismaClientKnownRequestError`, `code: P2039`, `meta.driverAdapterError.cause.originalCode: "53000"`, 판정 **false** |

## 운영에서도 같은 오류인가

맞다. Vercel `hallyu-brief`(`prj_PYTYRb8…`) 운영 런타임 로그를 `query=P2039` 로 지난 30분 동안 찾았다.

| 시각(UTC) | 경로 | 오류 |
|---|---|---|
| 15:07:21 | `/ru/news/nct-dream-…` | `prisma.article.groupBy()` → `code: 'P2039'`, `53000 … exceeded the quota` |
| 15:07:20 | `/zh-tw/news/jang-won-young-…` | 위와 같다 |

배포 `dpl_3KqZtYo7…` 의 `clientVersion` 은 `7.10.0` 이다. 로컬 재현과 같은 Prisma·`@prisma/adapter-pg` 버전이다.

## QA 가 주장한 영향 중 맞는 것과 틀린 것

| QA 주장 | 판정 | 근거 |
|---|---|---|
| `/api/items` GET 이 200 대신 500 을 준다 | 맞다 | 위 재현. `item-votes.ts:117` 에서 다시 던진다 → `api/items/[kind]/[itemId]/route.ts:20` |
| 투표가 503 대신 500 을 준다 | 맞다 | `item-votes.ts:162` |
| 사용자에게 보이는 차이가 있다 | **없다** | `components/ItemVote.tsx:76` 은 GET 이 실패하면 서버가 그린 숫자를 그대로 둔다. `:111` 은 429 가 아니면 모두 `voteError` 를 띄우므로 500 과 503 이 같은 문구다 |
| 고치면 장애 중에도 제품·드라마·시술 화면을 재생성·빌드할 수 있다 | **틀리다** | 모든 화면의 레이아웃이 대체 처리 없이 `listActiveCategories`(`lib/articles.ts:155-161`)를 부른다(`components/AppHeader.tsx:29`, `SiteFooter.tsx:23`). 재현: `isDbUnavailable` 이 true 가 되는 닫힌 포트에서도 `x-prerender-revalidate` 로 `/en/drama/queen-of-tears` 를 강제로 다시 그리게 하니 **500** 이 났다. 로그에는 ``Invalid `prisma.article.groupBy()` `` 와 `P1001` 만 남았다. 운영 로그도 같은 groupBy 에서 실패한다. 미리보기 빌드도 `listActiveCategories` 에서 막혔다(`cost.md:38`) |

## 고칠 때 (다음 작업, 30분 이하)

| 안 | 평가 |
|---|---|
| `DB_UNAVAILABLE` 에 `P2039` 를 통째로 넣는다 | 권하지 않는다. `P2039` 는 Prisma 가 따로 이름 붙이지 않은 Postgres 오류를 모두 담는 일반 코드다. 넣으면 진짜 쿼리 버그도 0표·503 으로 숨는다 |
| `err.meta?.driverAdapterError?.cause?.originalCode` 가 `53`(자원 부족)·`57P`(관리자 종료·시작 중)·`08`(연결 오류)로 시작하면 unavailable 로 본다. `P1000`·`P1002`·`P1008`·`P2037` 은 목록에 더한다 | 권한다. 로컬 재현에서 `originalCode: "53000"` 을 확인했다 |
| 화면이 장애를 견디게 하려면 | `listActiveCategories` 에도 빈 목록 대체가 있어야 한다. 이건 별도 작업이고 범위가 더 크다. 지금 장애의 근본 해결은 Neon 한도 문제(`cost.md`)다 |

테스트: 기존 `isDbUnavailable` 테스트가 있으면 53000 케이스 1개만 더한다(버그 재발 방지용).

## 정리한 것

검증용 가짜 DB(55433)와 임시 서버(3411·3412)는 껐다. 3400 은 그대로 200·HIT 다. 탐침 스크립트는 `/tmp/verify-p2039/probe.mts`, 서버 로그는 `/tmp/verify-p2039/next-341*.log` 에 있다.
