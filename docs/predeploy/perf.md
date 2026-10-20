# 배포 전 성능 점검 — 2026-10-19 (dev `1bb6006`)

측정만 했고 코드는 고치지 않았다. 측정 스크립트·원자료: `/tmp/perf-scripts/`, `/tmp/perf-unnie/` (Lighthouse JSON `lh/*.json`).

| 항목 | 조건 |
|---|---|
| 서버 | `http://localhost:3400` (`next start`, 로컬 DB). 운영 키(PostHog·GA·애드센스)가 없는 빌드라 서드파티는 따로 받아서 쟀다 |
| Lighthouse | 13.5.0 `--form-factor=mobile` (412×823, 화면 배율 1.75, 느린 4G 시뮬레이션, CPU 4배 느림). 경로당 2회, 중앙값. 아이폰 3배 화면은 `--screenEmulation.deviceScaleFactor=3 width=390` |
| 끝까지 스크롤 | Playwright `devices["iPhone 13"]`(390×844, 3배), 600px씩 내리며 모든 응답 크기를 더함 |
| 빌드 산출물 | `/tmp/unnie-final/apps/web/.next` (청크 크기는 gzip -9 기준) |
| 참고 | 측정 중 장비 부하 평균이 7.8이었다(다른 작업이 함께 돌았다). TBT는 실제보다 높게 나왔을 수 있다 |

## 1. 결론

- CPU 쪽은 문제없다: TBT 32~85ms, CLS 0(저장함 빼고), DOM 430~670개. **문제는 받는 양(바이트)이다.**
- **아이폰에서 홈 사진이 너무 크다.** 카드 사진으로 960px PNG(한 장 1.2~1.4MB)와 원본(2.5MB)을 받는다. 홈을 끝까지 내리면 12.3MB를 받고, 그중 사진이 11.5MB다.
- **줄바꿈 사전(budoux)과 linkedom이 든 142KB 청크**를 거의 모든 화면이 받는다. 탭바의 저장 탭을 미리 받으면서 같이 내려온다. 영어 독자도 받고, 실제로 쓰는 부분은 0%다.
- 첫 로드 JS 278KB 중 101KB(36%)가 PostHog다. 운영에서는 여기에 GA 175KB와 애드센스 250KB가 더 붙는다.
- 화면별로는 글 상세 LCP가 4.7초(84점)이고 저장함은 CLS 0.22(78점)다. 나머지 일곱 경로는 93~96점이다.

## 2. Lighthouse 모바일 (중앙값)

| 경로 | 점수 | FCP | LCP | TBT | CLS | 전송 | LCP 요소 |
|---|---|---|---|---|---|---|---|
| `/en` | 94 | 0.91s | 3.06s | 32ms | 0 | 1,336KB | 카드 글자 |
| `/en/news/ha-jung-woo-…-47c436` | **84** | 0.91s | **4.69s** | 64ms | 0 | 616KB | 히어로 사진 |
| `/en/guide` | 96 | 0.91s | 2.76s | 33ms | 0 | 705KB | 글자 |
| `/en/beauty` | 96 | 0.93s | 2.78s | 39ms | 0 | 670KB | 글자 |
| `/en/beauty/p/laneige-lip-sleeping-mask` | 94 | 0.92s | 3.15s | 41ms | 0 | 628KB | 글자 |
| `/ja/travel/place/n-seoul-tower` | 96 | 0.93s | 2.73s | 56ms | 0 | 619KB | 글자 |
| `/en/clinic/rejuran` | 96 | 0.92s | 2.46s | 75ms | 0 | 608KB | 글자 |
| `/zh-tw/drama` | 93 | 0.96s | 3.17s | 48ms | 0 | 626KB | 카드 글자 |
| `/en/saved` | **78** | 0.94s | 3.76s | 85ms | **0.221** | 714KB | 메모 글자 |
| 아이폰 3배 `/en` | 94 | — | 3.13s | 39ms | 0 | **1,886KB**(사진 1,161KB) | |
| 아이폰 3배 글 상세 | 81 | — | 4.97s | 71ms | 0 | 731KB(사진 367KB) | |

글자가 LCP인 화면은 실측 LCP가 약 0.1초다. 시뮬레이션 LCP가 2.5~3.2초로 나오는 것은 같이 내려받는 JS 약 500KB(첫 로드 + 프리페치)가 느린 4G 대역을 나눠 쓰기 때문이다. 그래서 JS를 줄이면 이 수치가 바로 내려간다.

## 3. 경로별 바이트

| 경로 | HTML 원본/gzip | 그중 RSC 페이로드 | next-intl 메시지(원본) | 첫 로드 JS(전송) | 프리페치로 더 받는 JS | 로드 때 RSC 프리페치 | 아이폰 끝까지 스크롤 합계 |
|---|---|---|---|---|---|---|---|
| home | 242 / 39KB | 63% | 35.6KB (14%) | 278KB | 240KB | 34건 132KB | **12,350KB** (사진 11,567) |
| news | 196 / 38KB | 65% | 35.6KB (18%) | 290KB | 0 | 0 | 1,465KB (사진 992) |
| guide | 119 / 24KB | 71% | 35.6KB (29%) | 270KB | 255KB | 29건 120KB | 832KB |
| beauty | 159 / 30KB | 68% | 35.6KB (22%) | 271KB | 222KB | 112KB | 901KB |
| product | 139 / 29KB | 69% | 35.6KB (25%) | 273KB | 218KB | 72KB | 863KB |
| place(ja) | 138 / 31KB | 72% | 41.9KB (30%) | 271KB | 215KB | 65KB | 850KB |
| clinic | 161 / 31KB | 68% | 35.6KB (22%) | 273KB | 212KB | 56KB | 876KB |
| drama(zh-tw) | 197 / 32KB | 65% | 34.0KB (17%) | 270KB | 209KB | 79KB | 994KB (RSC 386) |
| saved | 73 / 20KB | 80% | 35.6KB (**48%**) | **434KB** | 74KB | 150KB | 712KB |

**모든 화면에 공통으로 붙는 JS** (gzip, `/_next/static/chunks/`)

| 청크 | gzip / 원본 | 내용 |
|---|---|---|
| `021-udx8t49vg.js` | **103 / 318KB** | posthog-js — `instrumentation-client.ts:1`, `lib/track.ts:1`에서 정적 import |
| `1i6y4foniljx7.js` | 72 / 229KB | react-dom |
| `3zgw0ih1fugf1.js` | 46 / 168KB | Next 라우터 런타임 |
| `27k2hl7690-3n.js` · `3gw50kody2by5.js` · `19tx8_fmphk14.js` | 16 + 8 + 4KB | 레이아웃 섬(use-intl 메시지 포맷, 탭바·토스트·언어 제안·설치 안내) |
| `0cz1d0mv5g_q7.js` | 39 / 113KB | 폴리필(`noModule`). iOS·최신 브라우저는 받지 않는다 — 문제없음 |
| `0xz9b0ff5ph6k.js` (저장함 전용) | **163 / 380KB** | budoux(ja·zh-hans·zh-hant 모델) + linkedom·htmlparser2. LH 기준 미사용 141/142KB |

`"use client"` 파일은 54개(소스 합계 200KB)다. 레이아웃 섬은 28KB(gzip)로 작으니 줄일 대상은 위 두 청크다.

## 4. 문제와 수정안

| # | 심각도 | 문제 | 근거 | 수정 | 예상 절감 | 공수 |
|---|---|---|---|---|---|---|
| 1 | 높음 | 아이폰(3배 화면)에서 카드 사진으로 960px PNG·원본을 받는다 | 카드 `sizes="(max-width:640px) 45vw, 300px"` → 390×0.45×3=527px가 필요해 960w 후보를 고른다(`FeedCard.tsx:178`). 위키미디어 PNG 썸네일은 PNG 그대로라 960px가 1.2~1.4MB다. 원본 폭을 알 때 요청이 그보다 크면 원본을 쓴다(`lib/image.ts:21-27`). `Park_Kyung-hye…png`는 원본이 586px인데 2,508KB이고, 같은 사진 500px 썸네일은 402KB다 | ① `image.ts`: 원본 폭을 알면 '원본' 대신 원본보다 작은 가장 큰 표준 폭을 쓴다(586→500). ② 작은 자리는 2배까지만 받는다: `imgSrc`에 `#max=500` 같은 힌트를 붙이고 로더가 상한을 건다(`#ow=` 힌트와 같은 방식). `sizes`를 낮춰도 되지만 2배 화면에서 흐려진다 | 홈 서버 렌더 사진 28장(끝까지 볼 때): **6,836KB → 2,538KB(−63%)**. 첫 화면 사진(3배) 1,161KB → 약 600KB. 박경혜 사진 한 장 −2.1MB | M |
| 2 | 높음 | budoux+linkedom 청크(전송 142KB, 원본 380KB)를 탭바가 있는 모든 화면이 받는다 | 저장 탭 링크 프리페치가 `/saved` 엔트리를 받는다. `saved/page_client-reference-manifest.js`의 엔트리에 이 청크가 들어 있고, LH 기록에 `/en/saved?_rsc=` 바로 뒤에 `0xz9b0ff5ph6k.js`가 이어진다(home·guide·beauty·product·place·clinic·drama 모두). 원인은 `SavedRow.tsx:8,45`(`Words`→`Phrase`→budoux). 홈 무한 스크롤도 같은 청크를 받는다(`FeedLoader.tsx:18` 지연 import → `FeedCard.tsx:8` `Phrase`, 로더 청크 `3r05s47bso8cd.js`) | 당장: `TabBar.tsx`의 저장 탭 `Link`에 `prefetch={false}`를 단다. 근본: 줄바꿈 조각을 서버에서 나눠 보낸다(`/api/saved`·`/api/feed` 응답에 `titleChunks`를 넣고, 클라이언트는 `<wbr>`만 그린다). 클라이언트 번들에 budoux를 싣지 않는다 | 첫 방문마다 **−142KB 전송 / −380KB 파싱**. `/saved` 첫 로드 JS 434KB → 약 270KB | S(프리페치) / M(서버 분할) |
| 3 | 중간 | 글 상세 LCP 4.7초(84점, 아이폰 3배 4.97초) | 히어로가 `priority`만 있고 `fetchPriority`가 없다(`news/[slug]/page.tsx:255-260`). LH `lcp-discovery-insight` priorityHinted=false. 홈 히어로(`FeedCard.tsx:147-148`)에는 `fetchPriority="high"`가 있다. 히어로 250KB(아이폰은 원본 364KB)가 JS 290KB와 대역을 나눠 쓴다 | `fetchPriority="high"`를 넣는다(Next 16은 `priority` 대신 `preload`). #1·#4와 함께 고친다 | LCP 4.7초 → 3초대 예상, 점수 84 → 90 이상 | S |
| 4 | 중간 | PostHog를 정적 import해서 모든 화면의 첫 JS에 101KB가 실린다 | `instrumentation-client.ts:1`, `lib/track.ts:1`. LH 미사용 89/101KB, 부트업 94~115ms(beauty). 원격 설정상 녹화·설문은 꺼져 있다(`/array/<key>/config`: sessionRecording false, surveys false) | 두 파일 모두 `import("posthog-js")`로 바꾸고 `load` 이벤트 뒤 `requestIdleCallback`에서 초기화한다. `track()`은 초기화 전 이벤트를 작은 배열에 모았다가 넘긴다 | 첫 로드 JS **278 → 177KB(−36%)**. 시뮬레이션 LCP −0.3~0.5초 | S~M |
| 5 | 중간 | 저장함 CLS 0.221(78점) | 서버 HTML에는 빈 상태·목록이 없다(`SavedView.tsx:126-134` `hydrated &&`). 하이드레이션 뒤 메모가 들어오면서 푸터(높이 799px)가 밀린다(LH `cls-culprits-insight`: `footer.mt-12`) | 하이드레이션 전에도 EmptyMemo 높이만큼 자리를 둔다(`min-h` 또는 같은 크기 스켈레톤) | CLS 0.22 → 0, 점수 78 → 90대 | S |
| 6 | 중간 | 링크 프리페치로 안 볼 화면까지 받는다(데이터를 아끼는 독자에게 손해) | 화면에 보이는 카드 링크마다 RSC와 그 화면 JS를 미리 받는다. 로드 때 JS 209~255KB + RSC 56~150KB를 더 받고, 드라마 목록은 끝까지 내리면 RSC가 386KB다 | 카드가 촘촘한 목록(드라마·뷰티·클리닉·여행 카드, 가이드 타일)의 `Link`는 `prefetch={false}`로 둔다. 탭바와 주요 버튼만 미리 받는다 | 첫 방문 **−270~400KB** | S~M |
| 7 | 낮음 | 레이아웃이 next-intl 메시지 22개 네임스페이스를 모든 HTML에 싣는다(REVIEW-LEFT에 이미 있음) | `layout.tsx:99` `<NextIntlClientProvider>`에 messages를 따로 주지 않아 전체를 넘긴다. `request.ts:9-22`. en 32.3KB(gzip 11.7KB)이고 `/saved` HTML 원본의 48%다. 클라이언트가 쓰는 네임스페이스는 13개다(Engage·Nav·Travel 등) | `messages={pick(messages, CLIENT_NS)}`. 키 단위로 고르면 더 줄어든다 | HTML마다 −3KB gzip(네임스페이스 단위) ~ −10KB gzip(키 단위) | S~M |
| 8 | 결정 필요 | 서드파티가 앱 자체 JS보다 무겁다(운영) | 실측: `gtag.js` 175KB gzip(원본 535KB, 캐시 15분), `adsbygoogle.js` 67KB + `show_ads_impl_fy2021.js` 183KB, 여기에 광고 소재가 더 붙는다. 애드센스는 콘텐츠 화면마다 `<head>`에 async로 들어간다(`HeadScripts.tsx:41-50`, `AppHeader.tsx:55`). GA는 `afterInteractive`(`Analytics.tsx:25-26`) | GA4와 PostHog는 같은 이벤트를 보낸다(`track.ts`). 둘 중 하나만 남기는 것을 권한다. 애드센스를 `load` 뒤로 미루면 첫 화면 대역이 비지만, 자동 광고 수익에 영향이 있을 수 있어 사용자가 정한다 | GA를 빼면 **세션마다 −175KB**. 애드센스를 미루면 첫 로드 대역 −250KB | S |
| 9 | 결정 필요 | ISR 300초 재생성이 DB를 자주 깨운다(Neon 무료 한도) | `[locale]/page.tsx:28`, `c/[category]/page.tsx:17`, `news/[slug]/page.tsx:54`가 300초다. 글을 발행하면 워커가 `/api/revalidate`를 부르므로(`api/revalidate/route.ts:20-21`) 시간 기반 300초는 안전망일 뿐이다. 가이드 화면도 1시간마다 투표 집계를 조회한다(`beauty/data.ts:15`) | 홈·분류·글 화면을 3600초 이상으로 올린다. 한도를 넘긴 주원인은 매시간 50분 도는 파이프라인일 가능성이 크다(비용 점검 참고) | 해당 화면의 재생성 DB 조회 1/12 | S |
| 10 | 중간 | 뉴스 글은 빌드 때 하나도 만들어 두지 않는다 | `news/[slug]/page.tsx:57-59` `generateStaticParams(){return []}`, prerender-manifest의 `/news/` 경로가 0개다. 새 배포 뒤 글마다 첫 요청이 DB를 거쳐 그려진다 | DB가 꺼진 채로 배포하면 캐시 안 된 글은 그려지지 않는다. 배포는 DB가 돌아온 뒤에 한다. 최근 글 N개를 사전 생성하는 방안도 있지만 빌드가 DB에 더 기대게 된다 | — | 결정 |

## 5. 서드파티·폰트·정적 생성

| 대상 | 무게(전송) | 로드 시점 | 판단 |
|---|---|---|---|
| PostHog(자체 번들) | 101KB | 첫 JS(async), 하이드레이션 전 | 지연 로드(#4) |
| GA4 `gtag.js` | 175KB, `max-age=900` | 하이드레이션 뒤 | 하나로 정리(#8) |
| 애드센스 | 67KB + 183KB + 광고 소재 | `<head>` async, 콘텐츠 화면마다 | 수익과 맞바꿈(#8) |
| 쿠팡 | `<head>` 인라인 스크립트 1줄, 한국 시간대일 때만 iframe | — | 문제없음 |
| 폰트 | Instrument Serif 기울임 latin 15.7KB, 미리 받음, `display: swap`(로고만) | 첫 로드 | 문제없음 |
| CSS | 1개, 16KB gzip, 렌더 차단 약 150ms | 첫 로드 | 문제없음 |
| 정적 생성 | 1,836개 경로를 사전 생성. 뷰티·여행·클리닉·드라마는 `dynamicParams=false`. 저장함은 `s-maxage=31536000` | — | 좋음(뉴스 글만 #10) |
| 가이드 사진 | 가이드·뷰티·제품·명소·클리닉·드라마 화면은 `<img>` 0개(글자 커버) | — | 좋음 |

## 6. 권하는 순서(배포 전 → 배포 직후)

1. 배포 전, S급: #2 저장 탭 `prefetch={false}`, #3 `fetchPriority`, #5 저장함 자리 확보. 셋 다 한 줄에서 몇 줄 수준이고 동작은 바뀌지 않는다.
2. 배포 직후: #1 이미지 로더 상한(아이폰 독자 데이터 −60%), #4 PostHog 지연 로드.
3. 사용자 결정: #8 GA4와 PostHog 중 무엇을 남길지와 애드센스 지연 여부, #9 재생성 주기.

## 7. 재현

```bash
# Lighthouse (경로당 2회)
/tmp/perf-scripts/run_lh.sh && python3 -I /tmp/perf-scripts/lh_summary.py
# HTML·메시지 비중, 경로별 JS
python3 -I /tmp/perf-scripts/html_breakdown.py home news guide beauty product place clinic drama saved
python3 -I /tmp/perf-scripts/js_sizes.py home news guide beauty product place clinic drama saved
# 아이폰 13 끝까지 스크롤 전송량
node /tmp/perf-scripts/scroll_bytes.cjs
# 3배 vs 2배 사진 바이트
python3 -I /tmp/perf-scripts/imgcap.py home news
# 원본 PNG 크기
curl -s "https://commons.wikimedia.org/w/api.php?action=query&titles=File:Park_Kyung-hye_%EB%B0%95%EA%B2%BD%ED%98%9C_in_2022.png&prop=imageinfo&iiprop=size&format=json"
```

참고: 위키미디어는 썸네일 주소 끝에 `.webp`를 붙이면 WebP를 준다. 실험해 보니 500px PNG 402KB가 236KB로, 960px는 1,389KB가 842KB로 줄었다. 공식 문서는 확인하지 못했다. #1을 고친 뒤 추가로 검토할 선택지로만 적어 둔다.

## 8. 후속 — 2026-10-20 운영 홈 PageSpeed 76점(LCP 4.9초)

사용자 PageSpeed(모바일) 결과: 성능 76, FCP 1.5초, LCP 4.9초, TBT 270ms. LCP 요소는 피드 맨 위 사진(`Song_Il-gon.jpg` 960px, 244KB).
LCP 사진 자체는 이미 `<head>` preload(fetchPriority high)로 받고 있어서, 늦는 이유는 같이 받는 바이트(대역 경쟁)였다.

| 한 일 | 결과 |
|---|---|
| 3D 아이콘 PNG → WebP (`apps/web/scripts/icons3d-webp.mjs`, q80, 원본 PNG 는 그대로 둠) | 16개 328KB → 41KB. 홈 첫 화면 15개 287KB → 42KB |
| 64px 원형 인물 사진(K-pop 화제성)에 폭 후보를 줌 (`EntityAvatar.tsx`) | 1.75배 화면·PC 는 250px → 120px(지수 PNG 93 → 32KB). 아이폰 3배는 그대로 250px |
| 로컬 Lighthouse 13.5 모바일 4회 중앙값(`/en`) | 점수 70 → 76, 전송 1,883 → 1,538KB(−345KB). 로컬은 망 편차가 커서 LCP 절대값(8~9초)은 PSI 와 다르다 |

하지 않은 것과 이유

- **애드센스 지연 로드**: 남은 가장 큰 몫이다(첫 화면 전 253KB + 메인 스레드 약 350ms). 승인 심사 중에는 하지 않는다 — 심사 크롤러가 JS 를 실행하는지 공식 근거가 없어 `<head>` 의 정적 `<script async>` 를 그대로 둔다. **승인 뒤** 적용: 공식 코드와 같은 `<script async crossorigin>` 을 `load` 뒤 `requestIdleCallback`(사파리는 `setTimeout` 폴백)으로 넣고, `AdsenseUnit` 의 차단 감지(지금은 `load` 3초 뒤)를 스크립트 `onload`/`onerror` 기준으로 바꾼다. 첫 상호작용에만 넣는 방식은 쓰지 않는다(앵커 광고·리뷰어가 못 봄)
- **위키미디어 `.webp` 썸네일**: 주소 끝에 `.webp` 를 붙이면 되지만 문서화된 계약이 아니고, JPEG 는 10~20%·PNG 는 24~45%만 줄며 첫 요청은 변환 때문에 1~2.7초 늦다. LCP 사진(JPEG)에는 오히려 손해라 쓰지 않는다
- **LCP 사진 `preload` prop**: React 가 `loading="eager"`+`fetchPriority="high"` 인 `<img>` 로 이미 같은 preload 링크를 낸다(운영 HTML 확인). 더 붙여도 같은 링크로 합쳐진다
- **GA4 와 PostHog 중복**(4절 #8): 둘 다 `load` 뒤에 받아 LCP 에는 거의 영향이 없다. 하나만 남길지는 그대로 사용자 결정
- 레거시 JS 경고(22KB)는 Next 내장 폴리필(`Array.prototype.at` 등)과 posthog-js 라서 손대지 않는다. 위키미디어 캐시 TTL 경고도 우리가 바꿀 수 없다
