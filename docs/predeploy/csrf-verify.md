# CSRF(다른 사이트가 방문자 브라우저로 쓰기 요청) 검증 — 2026-10-20

대상 보고: `qa-edge.md` 7번 "다른 사이트가 방문자 브라우저를 시켜 투표·반응·신고를 보낼 수 있다". 검증 서버는 `http://localhost:3400`(dev 최신 빌드, 로컬 DB)이다. 코드는 고치지 않았다.

## 결론

| 항목 | 판정 |
|---|---|
| 재현 | **된다.** 다른 출처 페이지를 실제 Chromium으로 열자 로컬 DB의 표가 바뀌었다 |
| 설계상 의도인가 | 아니다. `docs/monetize/*`에 Origin·CSRF를 허용한다는 결정이 없다. PLAN.md:174는 400·403(봇)·404·429·503만 정의한다 |
| 로컬에서만 생기는 문제인가 | 아니다. 쓰기 핸들러와 `proxy.ts`에 Origin 검사가 없다. Next 라우트 핸들러와 Vercel은 이 검사를 자동으로 하지 않는다(서버 액션만 함) |
| 심각도 | **낮음.** 로그인·쿠키가 없어서, 빼앗기는 것은 방문자의 IP·UA뿐이다. 내일 배포를 막을 이유는 아니다 |
| 보고된 수정안 | 방향은 맞다. 다만 그대로 넣으면 **조회 수와 댓글 신고가 고장 난다**(아래 '수정안 보정') |

## 재현

| 단계 | 명령·주소 | 결과 |
|---|---|---|
| 1. 기준 집계 | `curl -s http://localhost:3400/api/items/drama/lovely-runner` | `{"3":1,"5":2, total 3}` |
| 2. 공격 페이지 | `http://127.0.0.1:8977/index.html`(`python3 -m http.server`로 띄움). `localhost`와는 다른 사이트다 | `fetch(".../api/items/drama/lovely-runner/vote", {method:"POST", mode:"no-cors", headers:{"content-type":"text/plain"}, body:'{"choice":"1","locale":"en"}'})` |
| 3. 실제 브라우저 | Playwright Chromium(HeadlessChrome 156)으로 2를 열었다 | 사전 요청(preflight) 없이 바로 POST가 나갔다. 서버 응답 200(페이지에서는 opaque로 보여 읽지 못한다) |
| 4. 결과 | 1과 같은 명령 | `{"1":1,"5":2}`. 같은 기기의 기존 표 3점이 1점으로 **바뀌었다** |
| 5. 원상 복구 | 같은 페이지에서 choice "3"으로 다시 보냈다 | `{"3":1,"5":2}`로 돌아왔다 |
| 6. 브라우저가 보내는 헤더 | 같은 요청을 에코 서버(`localhost:8978`)로 보냈다 | `Origin: http://127.0.0.1:8977`, `Sec-Fetch-Site: cross-site`, `Sec-Fetch-Mode: no-cors`, `content-type: text/plain`. 서버가 이 값만 보면 막을 수 있다 |

QA 원래 재현(`curl`에 `Origin: https://evil.example`을 붙이고 없는 항목으로 보내 404)은 형식 검증을 통과했다는 데까지만 보여 준다. 위 3~4단계에서 실제 항목의 표가 바뀌는 것을 확인했다.

## 코드 근거

| 엔드포인트 | 파일:줄 | 본문 읽기 | Origin·content-type 검사 | 다른 방어 |
|---|---|---|---|---|
| 항목 투표 | `apps/web/src/app/api/items/[kind]/[itemId]/vote/route.ts:11` | `request.json()`(content-type 무관) | 없음 | 봇 UA·voterHash(IP+UA)·IP당 시간 30표(`lib/item-votes.ts:144,155`) |
| 글 반응 | `api/reactions/[id]/route.ts:12` | 같음 | 없음 | `lib/engagement.ts:124` 봇 UA |
| 응원 | `api/cheer/[entityId]/route.ts:24` | 같음 | 없음 | 봇 UA·IP당 시간 20회 |
| 투표 | `api/polls/[id]/vote/route.ts:10` | 같음 | 없음 | voterHash |
| 댓글 작성 | `api/comments/route.ts:15` | 같음 | 없음 | `lib/comments.ts` 제한 |
| 댓글 신고 | `api/comments/[id]/report/route.ts:8` | **본문 없음** → JS 없는 HTML 폼으로도 보낼 수 있다 | 없음 | 서로 다른 IP 3명이면 숨김(`lib/comments.ts:22,209`) |
| 조회 수 | `api/views/[id]/route.ts:7` | 본문 없음 | 없음 | 없음(qa-edge 6번) |
| 공통 | `apps/web/src/proxy.ts:21` | matcher가 `api`를 뺀다 | — | — |

## 실제 피해 크기(낮음으로 보는 이유)

| 관점 | 내용 |
|---|---|
| 빼앗기는 권한 | 로그인·쿠키가 없다. 방문자의 IP·UA 조합 하나, 곧 항목마다 한 표뿐이다 |
| 공격 조건 | 방문자가 많은 외부 페이지가 있어야 한다. 방문자 한 명이 항목마다 한 표, 댓글마다 신고 하나를 보탠다 |
| 가장 아픈 경우 | 댓글 신고다. 공격 페이지를 서로 다른 IP 방문자 3명이 열면 원하는 댓글이 숨겨진다(폼 자동 제출, JS 불필요) |
| 막아도 남는 길 | curl 같은 비브라우저는 Origin을 마음대로 넣는다. 혼자서도 UA만 바꾸면 새 표가 된다(qa-edge 1번). 조작을 막는 데는 Vercel Firewall `POST /api/*` 횟수 제한(qa-edge 6번)이 더 크다 |

## 수정안 보정(보고된 그대로 넣지 말 것)

| 보고 내용 | 문제 | 고친 안 |
|---|---|---|
| content-type은 `application/json`만 받는다, 6개 핸들러 모두 | `ViewPing.tsx:38`은 `navigator.sendBeacon(url)`(본문·content-type 없음), `Comments.tsx:446` 신고는 `fetch(..., {method:"POST"})`(본문 없음)이다. 넣으면 **조회 수와 신고가 415/403으로 모두 실패한다** | content-type 검사는 JSON 본문을 읽는 4곳(투표·반응·응원·댓글)에만 둔다. 조회·신고는 Origin 검사만 한다 |
| Origin 호스트가 `SITE_URL`과 다르면 403 | `localhost:3400`, `192.168.0.200:3400`, Vercel 미리보기 주소가 모두 막힌다 | Origin 호스트를 요청의 `Host`(또는 `x-forwarded-host`)와 비교한다 |
| `Sec-Fetch-Site`가 cross-site이면 403 | `same-site`는 통과한다 | 헤더가 있으면 `same-origin`만 통과시킨다. 헤더가 없을 때(옛 브라우저)는 Origin 비교로 넘긴다. 둘 다 없으면 통과시킨다(curl은 어차피 막지 못한다) |

권장 순서: 내일 배포에는 넣지 않아도 된다. 배포 뒤 qa-edge 6번(Firewall 횟수 제한)과 함께, 위처럼 보정한 `lib/same-origin.ts` 하나를 POST 6곳에 넣는다. 댓글 수정·삭제(`api/comments/[id]/route.ts:8,18`, PATCH·DELETE)는 브라우저가 사전 요청을 먼저 보내고 서버가 CORS 허용을 주지 않으므로 대상이 아니다. 30분 이하 작업이다. 테스트는 '다른 출처 → 403, 같은 출처 sendBeacon → 204' 한 쌍이면 된다.

## 부수 효과

로컬 DB `drama/lovely-runner`의 기존 표 하나를 3→1→3으로 바꿨다. 집계는 처음과 같다(`updatedAt`만 바뀜). 임시 파일은 `/tmp/csrf-verify/`에 있고, 띄운 서버(8977, 8978)는 껐다.
