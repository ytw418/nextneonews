# 에러 추적: PostHog Error Tracking (2026-10-21)

Sentry 대신 이미 쓰는 PostHog(프로젝트 670566)의 에러 추적을 붙였다. 무료 한도는 예외 월 10만 건이다(넘으면 그달은 더 받지 않는다).
보는 곳: https://us.posthog.com/project/670566/error_tracking

## 무엇을 보내나

| 어디서 | 코드 | 잡는 것 |
|---|---|---|
| 브라우저 | `instrumentation-client.ts` → `lib/posthog.ts` `captureErrorPosthog` | 잡히지 않은 에러·Promise 거부, React 가 복구한 에러(하이드레이션 불일치 #418 등) |
| 에러 화면 | `[locale]/error.tsx`·`global-error.tsx` → `captureBoundaryError` | 에러 화면이 잡은 렌더 에러. Next 는 이것을 콘솔에만 찍어서 따로 보낸다. digest 가 있는(서버에서 난) 것은 서버가 보냈으니 뺀다 |
| 서버 | `instrumentation.ts` `onRequestError` → `lib/posthog-server.ts` | 화면 그리기·API·서버 액션·proxy 에러(notFound·redirect 는 Next 가 안 넘긴다). ISR 재생성 실패도 온다 |

- 운영 배포 빌드에만 토큰이 들어간다(`next.config.ts`). 로컬·미리보기는 아무것도 보내지 않는다.
- 한도 지키기: 브라우저는 탭마다 같은 에러 한 번·모두 10개까지, 스택에 `/_next/` 가 없는 에러(광고·분석 스크립트 안)는 버린다. 서버는 인스턴스마다 같은 화면·같은 에러를 10분에 한 번(DB 장애 때 모든 요청이 실패해도 몇 건만 간다).
- posthog-js 의 자동 캡처는 끈다(`capture_exceptions: false`). 받기 전 에러도 모아야 해서 리스너를 직접 단다. 켜면 같은 에러가 두 번 간다.
- 서버 이벤트에는 쿼리를 뺀 경로·메서드·라우트·digest 만 넣고 요청 헤더(쿠키·IP)는 넣지 않는다. 사람 프로필은 만들지 않는다.
- 소스맵: 운영 빌드에서 `@posthog/nextjs-config` 가 만들어 PostHog 에 올리고 지운다(`next.config.ts`). 키는 Vercel 운영 env `POSTHOG_API_KEY`(PostHog 개인 키 'unnienote vercel sourcemaps', error tracking 쓰기·organization 읽기)·`POSTHOG_PROJECT_ID`. 공개 소스맵은 Vercel 이 `.map` 을 403 으로 막아 못 쓴다.
- 개인정보처리방침(Trust/pages `privacy.posthog`, 9개 언어)에 오류 내용 전송 문장을 더했다.

## 확인 (로컬 운영 빌드, 2026-10-21 08:10 KST)

`VERCEL_ENV=production NEXT_PUBLIC_POSTHOG_KEY=<운영 토큰> npm run build -w @kmedia/web` → `DATABASE_URL` 을 닫힌 포트로 바꿔 `next start -p 3437`.

- 서버: `/en/idol/e2e-error-tracking-check?utm=secret` 500 → PostHog 에 `PrismaClientKnownRequestError`(`posthog-node`), `$pathname` 에 쿼리 없음. 같은 주소를 또 열어도 새로 가지 않았다.
  - Next 가 한 요청의 에러를 `…/[slug]` 와 `…/[slug]/page` 로 두 번 넘겨서, 중복 기준에서 `/page` 를 뗐다.
- 브라우저: 아이폰 에뮬레이션에서 하이드레이션 전에 제목 글자를 바꿔 React #418 → PostHog 에 `Minified React error #418`(`web`).
- 빌드 22초, `static/chunks/*.map` 41개, `posthog-node` 는 서버 번들에만 있다.

## 운영 확인 (e638159 배포 뒤, 08:23 KST)

- 운영 `unnienote.app/en` 에서 같은 방법으로 React #418 → PostHog 에 도착(`/relay/e/` 200). 확인용 이슈는 모두 해결(resolved) 처리했다.
- **남은 일: 브라우저 스택이 아직 원래 파일로 안 풀린다.** 이벤트 프레임의 `resolve_failure` 가 `HTTP error 403 while fetching` — Vercel 이 PostHog 의 JS·소스맵 요청에 시스템 챌린지(`x-vercel-mitigated: challenge`)를 건다. 서버 스택은 풀린다(posthog-node 가 함수 안 파일을 읽는다).
  - 고치는 법: Vercel → hallyu-brief → Firewall → 사용자 규칙 추가. 조건 `Request Path` starts with `/_next/static/` **그리고** `Request Path` matches regex `\.(js|map)$`, 동작 **Bypass** + 'system mitigations 도 건너뛰기'. 정적 파일이라 함수 비용은 없다. 다시 배포하지 않아도 다음 에러부터 풀린다.
  - Vercel MCP 는 이 프로젝트 방화벽 API 가 404(`Seawall Config not found`)라 못 넣었다. 사용자 크롬 vercel.com 세션으로 `PUT /api/v1/security/firewall/config?projectId=prj_PYTYRb8LwzL5JhGypO1mGh99BSyo&teamId=team_BzeZkq3AK4xznSh7vxovu57y` 를 보내면 된다(화면이 잠겨 있어 이번엔 못 함).
  - 대안: `@posthog/nextjs-config` 로 빌드 때 업로드(PostHog 개인 API 키 `error tracking write`·`organization read` 필요).

## 소스맵 업로드로 바꿈 (08:40 KST)

- 공개 방식은 두 겹으로 막혔다: ① PostHog 수집기에 Vercel 시스템 챌린지(403) ② Vercel 이 `.map` 을 로그인 없이 403(1바이트)으로 막음(배포 주소도 같음). 시스템 챌린지 건너뛰기는 요금제에서 안 된다(`System Bypass is not available for this plan`).
- Vercel 방화벽에 `/_next/static/*.js|map` Bypass 규칙은 넣어 뒀다(JS 는 200 이 됨. 업로드 방식에서는 없어도 된다).
- 개인 키는 자동화 크롬(9222)의 PostHog 세션으로 만들었고 Vercel env 는 Vercel CLI 토큰으로 넣었다.
- 로컬 확인: 업로드 빌드 → `761 chunk(s) uploaded`, 업로드 뒤 `.map` 삭제.
- 운영 확인(e0e539f, 08:40 KST): 운영 React #418 이벤트의 프레임이 `resolved=1`, `react-dom-client.production.js`·`scheduler.production.js` 로 풀렸다. 확인용 이슈는 해결 처리.
