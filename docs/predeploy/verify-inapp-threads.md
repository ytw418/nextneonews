# 검증: Threads·TikTok·WeChat 앱 안 브라우저를 알아보지 못해 저장함 경고가 빠지는 문제

- 검증일 2026-10-20, 대상 `http://localhost:3400` (dev 최신 빌드 `1bb6006`), 코드는 고치지 않았다.
- 결론: **재현됨, 실제 문제다. 심각도는 '낮음'으로 낮춘다** (보고는 '중간'). 배포를 막을 일은 아니다.

## 1. 재현

Playwright 1.64.1 WebKit, `devices["iPhone 15"]`, `localStorage["hb:saved"]`에 뷰티 3개를 넣고 `/en/saved`·`/zh-TW/saved`를 UA별로 열었다. 스크립트는 `/tmp/inapp-check/run.mjs`.

| UA 토큰 | 앱 | 경고 줄(`inAppNotice`) | '나에게 보내기' 버튼 |
|---|---|---|---|
| (Safari) | 사파리 | 없음 (맞음) | 있음 |
| `Instagram` | 인스타그램 | **보임** | 있음 |
| `FBAN/FBIOS` | 페이스북 | **보임** | 있음 |
| `Line/` | LINE | **보임** | 있음 |
| `Barcelona` | Threads | **안 보임** | 있음 |
| `musical_ly`·`BytedanceWebview` | TikTok | **안 보임** | 있음 |
| `MicroMessenger` | WeChat | **안 보임** | 있음 |
| `KAKAOTALK` | 카카오톡 | **안 보임** | 있음 |
| `xhsdiscover` | 샤오훙수 | **안 보임** | 있음 |

en·zh-TW 두 언어 모두 결과가 같다. 보고 내용대로 재현된다.

## 2. 원인

| 위치 | 내용 |
|---|---|
| `apps/web/src/components/saved/sendList.ts:13` | `const IN_APP = /Instagram\|FBAN\|FBAV\|\bLine\//;` 세 앱만 본다 |
| `apps/web/src/components/saved/SavedView.tsx:34,58,124-126` | `isInAppBrowser(navigator.userAgent)`가 참일 때만 경고 줄을 그린다 |
| 실제 Threads iOS UA | `… Mobile/20H392 Barcelona 435.0.0.14.71 (iPhone10,4; iOS 16_7_16; …; IABMV/1; …)`, `Instagram` 글자가 없다 (출처 whatmyuseragent.com/apps/mobile-app-threads, udger.com Threads App) |
| Threads 링크 열기 | 앱 안 WKWebView로 연다. 저장소가 사파리와 따로라서 경고 문구의 전제("Safari에서 안 보여요")가 그대로 맞는다 |

## 3. 설계상 의도인가

| 근거 | 판단 |
|---|---|
| `docs/monetize/BM-VALIDATION.md:157` "UA 에 Instagram·FBAN·Line 이 있으면 `/saved` 위에 … 한 줄" | 구현은 이 줄을 그대로 따랐다 |
| 같은 문서 `:34`, `:75` 문제 정의: "저장이 기기에만 남음(Safari 7일·인앱 브라우저)", "앱 안 브라우저에 갇힘" | 목표는 앱 안 브라우저 전체다. Threads를 빼야 할 이유는 어디에도 없다 |
| 같은 문서 `:11`, `:116`, `:187`, `RESULT.md:43` "다음 주 1순위 유입 = Threads(zh-TW) 매일" | 1순위 채널의 앱 안 브라우저가 빠진 것은 결정이라기보다 목록을 덜 채운 것으로 본다 |

그래서 문서가 정한 의도가 아니라 **명세 누락**으로 판단한다.

## 4. 심각도를 '낮음'으로 낮춘 이유

| 사실 | 근거 |
|---|---|
| '나에게 보내기' 버튼은 모든 브라우저에서 보인다 | 위 표, `SavedView.tsx:114-119` (`hasItems`만 조건) |
| 첫 저장 토스트에도 브라우저와 상관없이 '보내기' 동작이 붙는다 | `apps/web/src/components/SaveButton.tsx:55-62` |
| 빠지는 것은 `/saved`에 들어왔을 때 보이는 안내 한 줄뿐이다 | `SavedView.tsx:124-126` |
| 운영 실유입에는 아직 앱 안 브라우저가 거의 없다 | PostHog 최근 60일 `$pageview` 181건 중 Chrome Android 89, Mobile Safari 30, Chrome iOS 10, Google Search App iOS 2. `$raw_user_agent`는 수집하지 않는다 |
| Threads 운영은 다음 주부터라 그 전에 고치면 된다 | `RESULT.md:43` |

## 5. 제안된 수정에 대한 의견

| 보고 제안 | 의견 |
|---|---|
| `IN_APP`에 `Barcelona\|BytedanceWebview\|musical_ly\|MicroMessenger\|KAKAOTALK\|xhsdiscover` 추가 | **맞다.** 30분 안에 끝난다. 대상 독자를 보면 `Barcelona`(Threads, zh-TW 1순위)와 `BytedanceWebview\|musical_ly`(TikTok, vi·id)가 핵심이다. `GSA/`(구글 앱)도 앱 안 브라우저이고 실유입 2건이 있으니 함께 넣을지 검토한다 |
| `InstallPrompt.tsx:47` 정규식과 하나로 합쳐 `lib/in-app.ts`로 옮기기 | **그대로 합치면 틀린다.** InstallPrompt 목록에는 `CriOS\|FxiOS\|EdgiOS\|DuckDuckGo\|Whale` 같은 일반 브라우저가 들어 있다. 이것까지 합치면 크롬 iOS 독자에게 "this in-app browser" 문구가 뜬다. 앱 안 브라우저 토큰만 공용 상수로 빼고, InstallPrompt는 그 상수에 일반 브라우저 목록을 더해 쓰는 식이어야 한다 |
| InstallPrompt 쪽 누락 | 문제없다. `iosSafari()`가 먼저 `/Safari\//`를 요구한다(`:46`). Threads·TikTok·WeChat UA에는 `Safari/`가 없어서 이미 설치 안내가 뜨지 않는다 |

테스트: `sendList`에는 지금 테스트 파일이 없다. 고칠 때는 UA 판별(Threads 한 줄 참, 사파리 한 줄 거짓)을 재발 방지용 케이스 하나로 두면 충분하다.

## 6. 다시 확인하는 명령

```bash
node /tmp/inapp-check/run.mjs              # BASE=http://localhost:3400 LOCALES=en,zh-TW 기본값
```
