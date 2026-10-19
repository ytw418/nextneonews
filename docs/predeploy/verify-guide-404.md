# 검증: 가이드 상세 주소가 틀리면 영어로 된 맨 404가 나온다

검증일 2026-10-20 · 대상 `qa-edge.md` 5번(보고 심각도 '중간') · 로컬 운영 빌드 `http://localhost:3400`(dev `1bb6006`)과 운영 `https://unnienote.app` · 코드는 고치지 않음

## 결론

| 항목 | 판정 |
|---|---|
| 재현 | **된다.** 로컬과 운영 모두 같은 맨 404가 나온다 |
| 설계상 의도인가 | 아니다. `PLAN.md:43-44`는 `dynamicParams=false`를 **생성 방식**으로만 정했고, 404 화면을 어떻게 보일지는 정하지 않았다 |
| 로컬 환경 문제인가 | 아니다. 운영 `/en/schedule/nope`도 7,818B짜리 맨 404다 |
| 심각도 | **'중간'이 아니라 '낮음'.** 운영에 이미 있던 문제이고(일정·랭킹·없는 경로 전부), 내일 배포로 새로 생기는 문제가 아니다. 보고서가 말한 '저장함' 경로는 실제로는 404로 이어지지 않는다 |
| 배포 | 막지 않는다. 배포한 뒤에 고쳐도 된다 |

## 재현 측정

명령: `curl -s -o f -w "%{http_code} %{size_download}" <주소>` 다음 `<title>` 추출. 화면은 Playwright `iPhone 13`으로 측정.

| 주소 | 상태·크기 | 제목 | `lang` | 메뉴·링크 |
|---|---|---|---|---|
| 로컬 `/ja/beauty/p/discontinued-product` | 404 · 7,673B | `404: This page could not be found.` | 없음 | nav 0, 링크 0 |
| 로컬 `/en/beauty/skin-type/nope`, `/en/travel/nope`, `/en/travel/place/nope`, `/en/clinic/nope`, `/en/drama/nope`, `/en/schedule/nope`, `/en/rankings/nope` | 모두 404 · 7,673B | 같음 | 없음 | 없음 |
| 로컬 `/zh-tw/clinic/nope` | 404 · 맨 404 | 같음 | 없음 | 없음 |
| 로컬 `/en/foo`(어느 라우트에도 안 맞는 주소) | 404 · 7,673B | 같음 | 없음 | 없음 |
| 로컬 `/ja/c/unknown`(비교) | 404 · 61KB | `Unnie Note` | `ja` | nav 2, 링크 35, h1 `ページが見つかりませんでした`, '홈으로' 버튼, 탭바 |
| 로컬 `/ja/news/nope-slug`(비교) | 404 · 61KB | `Unnie Note` | `ja` | 사이트 화면 안의 일본어 404 |
| 운영 `/en/schedule/nope`, `/en/rankings/nope`, `/en/foo` | 404 · 7,818B | 맨 404 | — | — |
| 운영 `/en/c/unknown`, `/en/news/nope-slug` | **500** | — | — | DB 한도 초과(오늘 19:23~) 때문. 이 건과 별개 |

맨 404 응답 헤더: 로컬 `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1` / 운영 `x-vercel-cache: HIT`. 빌드 때 만든 정적 404라 함수 호출이 없다.

## 원인

| 근거 | 내용 |
|---|---|
| `dynamicParams = false` 9곳 | `beauty/p/[slug]/page.tsx:34`, `beauty/awards/[category]/page.tsx:25`, `beauty/skin-type/[type]/page.tsx:28`, `travel/[area]/page.tsx:25`, `travel/place/[slug]/page.tsx:38`, `clinic/[slug]/page.tsx:37`, `drama/[slug]/page.tsx:34`, `schedule/[id]/page.tsx:41`, `rankings/[chart]/page.tsx:11` (모두 `apps/web/src/app/[locale]/` 아래) |
| 루트 not-found 없음 | `apps/web/src/app/`에 `layout.tsx`·`not-found.tsx`가 없고 `[locale]/not-found.tsx`만 있다. 목록에 없는 값이면 Next가 페이지를 그리지 않고 라우트 단계에서 404를 내므로 `[locale]` 레이아웃 밖의 Next 기본 404가 나간다 |
| 없는 경로 | `[locale]/[...rest]` 같은 catch-all이 없어 `/en/foo`도 같은 맨 404다 |
| 비교 대상 | `c/[category]/page.tsx:17-19`, `news/[slug]/page.tsx:54-57`는 `generateStaticParams`가 있지만 `dynamicParams`가 기본값(true)이다. 페이지가 그려지다가 `notFound()`를 불러 레이아웃 안에서 9개 언어 404가 나온다 |

## 보고서 주장 점검

| 주장 | 확인 결과 |
|---|---|
| 맨 404, 언어·메뉴 없음 | 맞다(위 표, 캡처 측정) |
| `/en/c/unknown`은 사이트 안의 404 | 맞다(61KB, `lang="ja"`, 탭바 있음) |
| 운영 `/en/schedule/nope`도 같다 | 맞다(7,818B) |
| 카탈로그에서 뺀 제품이 **저장함**에 남아 있으면 이 화면으로 간다 | **틀리다.** `/api/saved`는 없어진 항목을 빼고 돌려주고(`api/saved/route.ts:9-10`), 저장함 행은 요약이 `null`이면 링크 없이(`SavedRow.tsx:32` `href={summary?.href}`) '정보를 불러오지 못함'(`SavedRow.tsx:46-47`)을 보인다 |
| 공유 링크·검색 결과 | 맞을 수 있다. 다만 지금 카탈로그에서 뺀 제품이 없고, 제품을 빼려면 배포가 필요하다. 실제로 닿는 경우는 오타·잘린 공유 링크·나중에 뺀 항목의 검색 색인이다 |
| 수정안: 9곳에서 `dynamicParams = false`를 지우면 `[locale]/not-found.tsx`가 그려진다 | 동작은 맞을 것으로 본다. 9곳 모두 DB를 부르기 전에 `notFound()`를 부른다(`beauty/p:72,82`, `awards:63-74`, `skin-type:56`, `travel/[area]:62,66`, `travel/place:104,108`, `clinic:89,93` 다음에 `getItemTotals`, `drama:75,79`, `schedule:111` `findEvent`는 정적 파일, `rankings:26` 다음에 `getLatestSnapshot`). 레이아웃(`[locale]/layout.tsx`)도 DB를 부르지 않으므로 DB가 꺼져 있어도 500이 되지 않는다 |
| 30분 이하(S) | 코드 양은 S가 맞다 |

## 수정안의 대가(보고서에 없는 것)

| 항목 | 내용 |
|---|---|
| 비용 | 지금은 틀린 주소가 CDN의 정적 404(함수 0회)다. 지우면 틀린 slug마다 서버에서 그린다(함수 1회 + ISR 캐시 쓰기). 스캐너가 아무 slug나 두드리면 그만큼 는다. Vercel Pro 포함량 안에서 작지만 '0'에서 늘어나는 쪽이다 |
| 문서 결정과 충돌 | `PLAN.md:43-44`가 뷰티 두 화면에 `dynamicParams=false`를 적었다. `cost.md:97`도 인물 페이지에 `dynamicParams=false`를 권한다. 지우면 PLAN 표를 같이 고쳐야 한다 |
| 다른 방법 | Next 16.4.1의 `global-not-found.tsx`는 아직 실험 기능이다(`next/dist/server/config-shared.js` `globalNotFound: false`). 언어를 params로 받지 못해 9개 언어로 그리기 어렵다 |
| 사이트 안 404의 한계 | 비교 대상인 사이트 안 404도 서버 HTML은 `<html id="__next_error__">`에 본문이 비어 있고 JS가 돌아야 글자가 보인다(로컬 `/ja/news/nope-slug` 원문). 메타에 `noindex`와 `index, follow`가 함께 들어 있다. 아이폰 사파리에서는 JS가 돌므로 보이는 데는 문제없다 |

## 권고

| 순서 | 할 일 | 시점 |
|---|---|---|
| 1 | 내일 배포는 이 건 때문에 막지 않는다 | 배포 전 |
| 2 | `[locale]/[...rest]/page.tsx`(바로 `notFound()`)만 먼저 추가한다. `/en/foo` 같은 오타 주소가 9개 언어 사이트 화면 안의 404로 바뀌고, 9개 상세 화면의 정적 404는 그대로 둔다 | 배포 뒤 |
| 3 | 9곳의 `dynamicParams = false` 제거는 함수 호출이 조금 느는 것을 받아들일 때 한다. 하면 `PLAN.md:43-44`의 '생성' 칸도 고친다 | 배포 뒤, 선택 |
