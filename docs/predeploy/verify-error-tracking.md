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
- 소스맵: `productionBrowserSourceMaps: true` 로 공개한다. PostHog 가 공개 소스맵을 받아 스택을 원래 파일·줄로 바꾼다(업로드 키 불필요). 레포가 공개라 새로 드러나는 코드는 없다. 서버 스택은 압축된 채로 온다(메시지·라우트로 충분, 필요하면 `experimental.serverSourceMaps`).
- 개인정보처리방침(Trust/pages `privacy.posthog`, 9개 언어)에 오류 내용 전송 문장을 더했다.

## 확인 (로컬 운영 빌드, 2026-10-21 08:10 KST)

`VERCEL_ENV=production NEXT_PUBLIC_POSTHOG_KEY=<운영 토큰> npm run build -w @kmedia/web` → `DATABASE_URL` 을 닫힌 포트로 바꿔 `next start -p 3437`.

- 서버: `/en/idol/e2e-error-tracking-check?utm=secret` 500 → PostHog 에 `PrismaClientKnownRequestError`(`posthog-node`), `$pathname` 에 쿼리 없음. 같은 주소를 또 열어도 새로 가지 않았다.
  - Next 가 한 요청의 에러를 `…/[slug]` 와 `…/[slug]/page` 로 두 번 넘겨서, 중복 기준에서 `/page` 를 뗐다.
- 브라우저: 아이폰 에뮬레이션에서 하이드레이션 전에 제목 글자를 바꿔 React #418 → PostHog 에 `Minified React error #418`(`web`).
- 빌드 22초, `static/chunks/*.map` 41개, `posthog-node` 는 서버 번들에만 있다.
