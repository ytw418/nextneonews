# 보안 헤더 없음(클릭재킹·X-Powered-By) 검증 — 2026-10-20

대상 보고: `qa-edge.md` 11번 "보안 헤더가 없다(클릭재킹 방어 없음, X-Powered-By 노출)". 검증 서버는 `http://localhost:3400`(dev 최신 빌드)와 운영 `https://unnienote.app`. 코드는 고치지 않았다.

## 결론

| 항목 | 판정 |
|---|---|
| 재현 | **된다.** 로컬과 운영 모두 `X-Frame-Options`·CSP·`X-Content-Type-Options`·`Referrer-Policy`가 없고 `X-Powered-By: Next.js`가 있다. 다른 출처 페이지가 투표 화면을 iframe에 넣을 수 있다 |
| 설계상 의도인가 | 아니다. `docs/monetize/*`·`docs/deploy.md`에 iframe 허용이나 보안 헤더를 다룬 결정이 없다 |
| 로컬에서만 생기는 문제인가 | 아니다. 운영 응답도 같다. Vercel은 HSTS만 넣는다 |
| 심각도 | **낮음.** 배포를 막을 일은 아니다. 클릭재킹으로 얻는 것(투표 조작)은 이미 CSRF로 더 쉽게 된다(`csrf-verify.md`) |
| 보고된 수정안 | 대체로 맞다. 다만 `X-Frame-Options: SAMEORIGIN`을 넣으면 **PostHog 앱 안의 히트맵 화면이 빈 화면이 된다**(아래 '수정안 보정') |

## 재현

| 단계 | 명령·주소 | 결과 |
|---|---|---|
| 1. 로컬 헤더 | `curl -sI http://localhost:3400/en` | `X-Powered-By: Next.js`. XFO·CSP·nosniff·Referrer-Policy 없음 |
| 2. 운영 헤더 | `curl -sI https://unnienote.app/en` | `x-powered-by: Next.js`, `strict-transport-security: max-age=63072000`(Vercel). XFO·CSP·nosniff·Referrer-Policy 없음 |
| 3. 다른 경로 | `/en/drama/lovely-runner`, `/en/saved`, `/api/items/drama/lovely-runner`, `/relay/static/array.js` | 모두 위 네 헤더 없음 |
| 4. 실제 iframe | `127.0.0.1:8979`(다른 출처)에 `<iframe src="http://localhost:3400/en/drama/lovely-runner" style="opacity:0.01">`를 두고 Playwright Chromium으로 열었다 | 막히지 않고 로드됐다. 제목 "Lovely Runner (2024)…", 버튼 "1 star"~"5 stars"·"Save “Lovely Runner”"가 투명한 창 안에 보인다. 콘솔에 frame 거부 메시지 없음 |

## 코드 근거

| 위치 | 내용 |
|---|---|
| `apps/web/next.config.ts:40-42` | `headers()`가 `guideNoindexHeaders()`만 돌려준다 |
| `apps/web/src/lib/guide-seo.ts:63-73` | 그 규칙은 가이드 일부 언어와 시술 noindex 뿐이다 |
| `apps/web/next.config.ts:14-57` | `poweredByHeader` 설정이 없다(Next 기본값 true) |
| `apps/web/src/proxy.ts:8-17` | 응답 헤더를 더하지 않는다. matcher가 `api`·`relay`를 뺀다(`:21`) |
| 저장소 전체 검색 | `x-frame`·`frame-ancestors`·`nosniff`·`Referrer-Policy`·`poweredBy`가 코드에 없다. 문서에서는 `qa-edge.md:27`뿐이다 |

## 실제 위험 크기

| 공격·노출 | 지금 가능한가 | 비고 |
|---|---|---|
| 투표를 iframe 클릭으로 유도 | 가능 | 같은 조작을 CSRF로 클릭 없이 할 수 있다(`csrf-verify.md` 3~4단계). XFO만 넣으면 이 길은 그대로 열려 있다 |
| 저장함 조작 | 사실상 불가 | 다른 사이트 안의 iframe은 Chrome·Safari에서 localStorage가 분리된다. 방문자의 실제 저장함(최상위 창)에 닿지 않는다 |
| 제휴 링크 클릭 유도 | 가능 | 남이 우리 사이트를 투명하게 띄워 제휴 링크를 누르게 하면 제휴사가 부정 클릭으로 볼 수 있다. 일어날 가능성은 낮다 |
| `X-Powered-By: Next.js` | 노출 | 정보 노출일 뿐이다. HTML의 `/_next/` 경로로도 Next인 것은 보인다 |
| `Referrer-Policy` 없음 | 영향 없음 | 브라우저 기본값이 이미 `strict-origin-when-cross-origin`이다. 넣어도 동작이 바뀌지 않는다 |
| `nosniff` 없음 | 영향 작음 | 사용자 업로드 파일이 없다. 점검 도구 경고만 사라진다 |

## 수정안 보정

| 보고된 수정 | 보정 |
|---|---|
| `X-Frame-Options: SAMEORIGIN` | PostHog 앱의 히트맵 화면은 사이트를 `https://us.posthog.com` iframe에 띄운다. SAMEORIGIN이면 빈 화면이 된다(PostHog 문서 posthog.com/docs/toolbar/heatmaps). XFO 대신 `Content-Security-Policy: frame-ancestors 'self' https://us.posthog.com`을 쓴다. 히트맵을 안 쓸 거면 보고대로 해도 된다 |
| `X-Content-Type-Options: nosniff` | 그대로 |
| `Referrer-Policy: strict-origin-when-cross-origin` | 넣어도 되지만 효과는 없다(기본값) |
| `poweredByHeader: false` | 그대로 |
| 합치는 방법 | `headers()`를 `[{ source: "/:path*", headers: [...] }, ...guideNoindexHeaders()]`로 바꾼다. Next는 맞는 규칙의 헤더를 모두 붙이므로 noindex와 겹쳐도 된다. `/relay`(PostHog 재작성)에 붙어도 해가 없다 |
| 쿠팡 배너 | 우리가 남의 iframe을 넣는 쪽이라 `frame-ancestors`의 영향을 받지 않는다(`CoupangBanner.tsx:63`). `frame-src` 같은 다른 CSP 지시어는 넣지 않는다 |
| 순서 | 투표 조작을 막으려면 CSRF(Origin 검사, `csrf-verify.md`)를 먼저 고친다. 이 헤더는 같이 넣는 30분짜리 정리다 |
