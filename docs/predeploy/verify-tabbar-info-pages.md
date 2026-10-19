# 검증: /partners·/disclosure 에서 하단 '홈' 탭이 켜져 보인다

검증일 2026-10-20 · 대상 QA 보고 F13(보고 심각도 '낮음', UX) · 로컬 운영 빌드 `http://localhost:3400`(dev `1bb6006`)과 운영 `https://unnienote.app` · 코드는 고치지 않음

## 결론

| 항목 | 판정 |
|---|---|
| 재현 | **된다.** `/en/partners`·`/en/disclosure` 에서 홈 탭에 선택 배경(`bg-brand-weak`)과 채운 아이콘이 붙는다 |
| 설계상 의도인가 | **그렇다.** 탭 바깥의 모든 화면은 홈 탭 아래 화면으로 묶는 것이 처음(2026-10-16)부터의 설계다. 두 화면은 상단바도 '홈의 하위 화면'(뒤로 버튼, 부모 `/`)으로 그린다 |
| 새로 생긴 문제인가 | 아니다. 운영 `/en/about`·`/en/privacy` 도 지금 홈 탭이 켜져 있다 |
| 접근성 | 문제없다. `aria-current="page"` 는 정확히 `/` 일 때만 붙어서, 화면 읽기는 두 화면에서 '현재 페이지'를 말하지 않는다 |
| 판정 | **real=false** (설계상 의도) |

## 재현 측정

명령: `curl -s http://localhost:3400<주소>` 로 받은 SSR HTML 에서 탭바 `<nav>`의 각 `<a>` 를 뽑아 `bg-brand-weak`(선택)·`aria-current` 를 확인.

| 주소 | 홈 탭 선택 | 홈 탭 `aria-current` | 다른 탭 | 상단바 |
|---|---|---|---|---|
| 로컬 `/en/partners` | 켜짐 | 없음 | 모두 꺼짐 | `Back` 버튼(pushed) |
| 로컬 `/en/disclosure` | 켜짐 | 없음 | 모두 꺼짐 | `Back` 버튼(pushed) |
| 로컬 `/en/about`, `/en/privacy` | 켜짐 | 없음 | 모두 꺼짐 | — |
| 로컬 `/en`(비교) | 켜짐 | `page` | 모두 꺼짐 | — |
| 운영 `/en/about`, `/en/privacy` | 켜짐 | — | 랭킹·일정 꺼짐(구 탭 3개) | — |

## 설계상 의도라는 근거

| 근거 | 위치 | 내용 |
|---|---|---|
| 기본 선택이 홈 | `apps/web/src/components/TabBar.tsx:44-50` | 가이드·저장·랭킹(+인물)이 아니면 `"/"`. 바로 위 주석(43줄) "일정은 홈에서 들어가서 홈" — 화면을 들어온 탭에 묶는 규칙 |
| 홈이 켜져도 현재 페이지는 아님을 명시 | `TabBar.tsx:64-65` | "정확히 그 화면일 때만 (카테고리·글에서는 홈 탭이 선택돼 보여도 현재 페이지는 아니다)" → `aria-current` 는 `pathname === href` 일 때만 |
| 처음부터의 설계 | `git show fc98e89:apps/web/src/components/TabBar.tsx` 22·35줄 (2026-10-16 '내비게이션 셸') | `selected = pathname.startsWith("/schedule") ? "/schedule" : "/"` — 탭이 아닌 화면은 모두 홈. 오늘 탭 4개로 늘린 `c16251b` 도 이 기본값을 유지 |
| 두 화면의 부모가 홈 | `apps/web/src/app/[locale]/partners/_ui/TrustFrame.tsx:77` | `<AppHeader variant="pushed" parentHref="/" …/>` — `/partners`·`/disclosure` 둘 다 이 틀을 쓴다. 홈 아래 하위 화면이라 홈 탭이 켜지는 것과 맞다 |
| 진입점 | `apps/web/src/components/SiteFooter.tsx:127-133` | 두 화면은 푸터 링크로 들어간다(`PLAN.md:266` "아래에 `/partners /disclosure`") |
| 탭 명세 | `docs/monetize/PLAN.md:292-293` (§6-0) | 선택 판정에 guide·saved 만 추가하라고 정했고, 정보 화면을 '선택 없음'으로 하라는 결정은 없다 |

iOS 탭바 관례도 같다: 탭은 항상 하나가 선택돼 있고, 탭 안에서 밀어 넣은 화면은 그 탭이 켜진 채로 보인다. 앱처럼 보이게 만든 이 사이트(떠 있는 캡슐 탭바, 상단바 root/pushed)에서는 이 쪽이 일관된다.

## 제안된 수정(`selected = null`)을 하지 않는 이유

| 영향 | 내용 |
|---|---|
| 일관성이 깨짐 | 같은 규칙으로 홈에 묶인 `/about`·`/privacy`·`/contact`·`/editorial-policy`·`/c/*` 와 두 화면만 달라진다. 바꾸려면 이 화면들 전체의 정책을 정해야 한다 |
| 득이 작음 | 화면 위에 뒤로 버튼과 큰 제목이 있어 현재 위치는 이미 보인다. 화면 읽기도 '현재 페이지'로 잘못 말하지 않는다 |

## 남는 메모(배포와 무관)

- 가이드 상품 상자(`components/affiliate/AffiliateBox.tsx`)의 고지 링크로 `/disclosure` 에 가면 가이드 탭 → 홈 탭으로 불이 옮겨 간다. 다만 '뒤로'는 기록이 있으면 `router.back()` 이라 가이드로 돌아가므로 길을 잃지 않는다(`components/BackButton.tsx:17`). 바꾸고 싶다면 '들어온 탭 유지'라는 별도 설계 결정이 필요하다.
