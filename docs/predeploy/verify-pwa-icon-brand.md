# 검증: PWA 아이콘·설치 안내 카드가 옛 브랜드 'H.'

- 검증일: 2026-10-20, 브랜치 `dev-ad-revenue-info-review-app` (= `dev`, 둘 다 `1bb6006`)
- 대상: http://localhost:3400 (dev 최신 운영 빌드), 비교용 운영 https://unnienote.app
- 결론: **재현됨 (real = true), 심각도 낮음.** 설계 의도 아님. 로컬 환경 문제도 아님(운영에서도 같은 파일이 나간다)

## 1. 재현 결과

| 확인 | 명령·방법 | 결과 |
|---|---|---|
| 안드로이드 설치 아이콘 192 (로컬) | `curl -o local-192.png "http://localhost:3400/api/pwa-icon?size=192"` | 200 image/png 1,491B, 그림 **'H.'** |
| 안드로이드 설치 아이콘 512 (로컬) | `curl ".../api/pwa-icon?size=512"` | 그림 **'H.'** |
| 같은 아이콘 (운영) | `curl "https://unnienote.app/api/pwa-icon?size=192"` | md5 `3301d026…` 로 로컬과 **바이트 단위로 같다** |
| 아이폰 홈 화면 아이콘 | `curl http://localhost:3400/apple-icon` | 그림 **'U.'** (정상) |
| 파비콘 | `apps/web/src/app/icon.svg:3` | `U` (정상) |
| manifest | `curl http://localhost:3400/manifest.webmanifest` | 이름 "Unnie Note", 아이콘 3개 모두 `/api/pwa-icon` → 이름과 아이콘이 서로 다르다 |
| 아이폰 설치 카드 | Playwright WebKit, iPhone UA(Safari 18.5), `/en/guide` 열고 2.5초 뒤 `scrollTo(0,600)` | `aside[aria-labelledby=install-title]` 글자 = `"H.\n\nAdd Unnie Note to your Home Screen\n\nShare → Add to Home Screen"`. 캡처에 왼쪽 아이콘이 'H.' |

캡처는 `/tmp/pwaicon-check/{card.png, local-512.png, local-apple.png}` (저장소 밖, 커밋 안 함).

## 2. 원인 (코드 근거)

| 파일:줄 | 지금 | 비교 |
|---|---|---|
| `apps/web/src/app/api/pwa-icon/route.tsx:28` | `H<span …>.</span>` | `apple-icon.tsx:23` 은 `U<span …>.</span>` |
| `apps/web/src/components/InstallPrompt.tsx:161` | `H<span className="wordmark-dot">.</span>` | 바로 위 주석(`:158`)이 "홈 화면에 생길 아이콘 그대로 (apple-icon 과 같은 모양)" — 의도는 apple-icon('U.')과 같게 |

- 커밋 `9174928`(사이트 이름 Unnie Note 로)이 `apple-icon.tsx`·`icon.svg`·`manifest.ts` 는 바꿨지만 위 두 파일은 바꾸지 않았다(`git show --stat 9174928` 에 두 파일 없음).
- `pwa-icon/route.tsx` 는 `fc98e89` 이후 손대지 않았고, `InstallPrompt.tsx` 의 그 줄도 이름 변경 커밋에서 빠졌다.
- `docs/monetize/*`·`docs/deploy.md`·`docs/revenue.md` 에 'H.' 를 남기기로 한 결정은 없다(`grep -rn "pwa-icon\|H\.\|Hallyu"` 결과 없음). 머리말·바닥글 로고는 `SITE_NAME.split(" ")` 첫 단어를 써서 이미 'Unnie.'다(`AppHeader.tsx:38-40`, `SiteFooter.tsx:31-33`).

## 3. 보고서에 없던 영향 (추가 확인)

| 영향 | 근거 |
|---|---|
| 구글 구조화 데이터의 발행처(Organization) 로고도 'H.' | `apps/web/src/lib/jsonld.ts:42` `LOGO = …/api/pwa-icon?size=512`. 운영 `curl https://unnienote.app/en` 의 JSON-LD 에 `"logo":{"url":"https://unnienote.app/api/pwa-icon?size=512"}` |
| 고친 뒤에도 이미 받은 브라우저는 최대 7일 옛 그림을 쓴다 | 응답 헤더 `cache-control: public, max-age=604800, immutable` (`route.tsx:31`, 운영 `curl -I` 로 확인). 주소가 같아서 브라우저 캐시가 새로 받지 않는다 |

## 4. 고치는 법 (코드는 고치지 않았다)

| 순서 | 할 일 | 크기 |
|---|---|---|
| 1 | `route.tsx:28` 과 `InstallPrompt.tsx:161` 의 `H` 를 `U` 로 | 2줄 |
| 2 | (권장) 캐시를 끊도록 아이콘 주소에 판 번호를 붙인다: `manifest.ts:18-20`, `jsonld.ts:42` 의 `/api/pwa-icon?size=…` 뒤에 `&v=2`. route 는 `size`·`maskable` 만 읽으므로 다른 변경 없음 | 4줄 |
| 3 | 확인: `curl "http://localhost:3400/api/pwa-icon?size=192&v=2"` 그림이 'U.', iPhone UA 로 `/en/guide` 스크롤 시 카드 아이콘 'U.' | — |

- 노력: S(30분 이하). 테스트 추가는 필요 없다(문구·마크업 변경).
- 참고(이번 버그와 별개, 고치지 않아도 됨): 설치 카드는 Georgia 이탤릭 세리프(`.wordmark`)로, apple-icon·pwa-icon PNG 는 `ImageResponse` 기본 산세리프 직립으로 그려져 글자 모양까지 같지는 않다.

## 5. 판정

| 항목 | 값 |
|---|---|
| 재현 | 예 (로컬·운영 모두) |
| 설계 의도 | 아님 (주석이 apple-icon 과 같은 모양을 요구) |
| 운영 관련 | 예 — 안드로이드 설치 아이콘, 아이폰 설치 카드, 구글 발행처 로고 |
| 심각도 | 낮음 — 기능은 정상, 브랜드 표기만 어긋남. 배포를 막을 일은 아님 |
