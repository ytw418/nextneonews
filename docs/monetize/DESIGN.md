# 언니노트 가이드 섹션 디자인 기준서 (2026-10-19)

대상: `/guide` 아래 뷰티·여행·클리닉·드라마와 `/saved`. 설계는 `PLAN.md` §6, 토큰은 `apps/web/src/app/globals.css`, 레퍼런스 캡처는 `docs/design/refs-v3/`(아이폰 15, 2배). 이 문서는 구현자가 클래스 그대로 옮길 수 있게 쓴다. 기준 화면 390×844, 스크롤 0.

## 1. 원칙 5줄

1. **사진 없이 성립한다.** 모든 제품·명소·시술·드라마는 틴트 바탕 + 큰 글자(이니셜·숫자) '타이포 커버'로 보인다. 회색 빈 상자·일러스트 자리표시 금지.
   - **2026-10-20 교체**: 유령 글자 커버는 "숫자 배경이 비어 보인다"는 피드백으로 없앴다. 지금은 회색 면 + 3D 아이콘(제품은 대표 성분, 드라마는 작품 상징, 시술별) 또는 위키미디어 CC 사진(여행 명소·동네)이다 — `docs/design/REFRESH-2026-10-20.md` '가이드 커버'. 아래 유령 글자 설명은 옛 기록이다.
2. **숫자가 주인공.** 순위·별점·도장 수·투표 %는 화면에서 가장 큰 글자다. 케이아지트는 점수를 뱃지 안에 숨긴다(`refs-v3/kagit-article-2`) — 우리는 1·2·3 을 포스터 숫자로 찍는다.
3. **첫 화면에 행동 하나.** 모든 화면의 스크롤 0 안에 하트·투표·별점·도장·테스트 중 하나가 보인다. 첫 화면에 광고·앱 배너·언어 제안 바는 0개.
4. **색은 셋.** 화면마다 섹션 틴트 1 + 브랜드(체리) 1 + 잉크. 다색 막대·메달 금·은·동·그라데이션 없음(케이아지트 5색 막대, 화해 메달의 반대).
5. **지금 뼈대 그대로.** 크림 바탕·알약 칩·떠 있는 탭바·`ListRow`·`SectionHeader`·`Badge`·`Button`·`BottomSheet`·`toast` 를 쓴다. 새 글자 크기·새 색은 아래 §3 의 7개 말고는 만들지 않는다. `lint-tokens --strict` 통과.

## 2. 레퍼런스에서 본 것

### 2-1. 케이아지트 해부 (`kagit-home-1~4`, `kagit-ranking-1~3`, `kagit-article-1~3`)

첫 화면 구조(위→아래): 일본어 제안 바(56px) → 로고·검색·메뉴 → 번호 알약 헤드라인 2개 → "正在竄升" 인물 칩 레일(이름·카테고리·急上升 뱃지) → "最新 / 全部→" → **한 열 큰 사진 카드**(사진 4:3 + 카테고리 칩, 제목 2줄, 요약 2줄, 작성자·시각) → 3번째 카드 자리에 광고 → 탭 5개(首頁·發現·排行榜·創作者·我的). 랭킹 허브는 "틴트 정사각 아이콘 + 제목 + 한 줄 + 회색 칩 + 準備中" 카드 7장, 차트 화면은 출처 칩(theqoo 5000筆…)·가중치(KR 30% GL 30%…)·5색 누적 막대·"已測 4/4 軸".

| 약점 | 근거 캡처 | 우리가 이기는 화면 |
|---|---|---|
| 사진 의존: 팬 캡처·저화질, 사진 없으면 카드가 없음 | home-1·3 | 모든 화면 — 타이포 커버는 0 ms 에 뜨고 권리 문제 없음 |
| 첫 화면에 기사 1.5개, 2화면째 광고, 언어 바가 56px 차지 | home-1·3 | `/guide`·`/beauty` 첫 화면: 광고 0, 행동 1 |
| 참여 장치 없음(하트·저장·투표 없음, 我的는 로그인) | home 전부 | `/beauty/p`(투표) · `/travel/place`(도장) · `/drama/[slug]`(별점) · `/saved` |
| 랭킹이 데이터 대시보드: 전문용어·5색 막대·작은 점수 | article-1~3 | `/beauty` 어워드: 큰 숫자 + 한 줄 산식("조회·저장·투표로 매김") |
| 시각이 범용 SaaS: 흰 카드·틴트 아이콘·회색 칩, 準備中 노출 | ranking-1~3 | `/guide` 허브 타일: 타이포 커버 타일, 빈 섹션은 안 보인다 |
| 뷰티 랭킹이 화해·올영·글로우픽 집계, 구매 연결 없음 | ranking-1 | `/beauty/p`: 내 피부 타입 집계 + "어디서 사나" |

### 2-2. 트렌드 문법 (2025~26, 젊은 여성 앱)

| 문법 | 캡처 근거 | 우리 적용 |
|---|---|---|
| 2열 3:4 세로 카드, 순위는 좌상단 작은 검정 사각, 하트는 우하단, 태그는 좌하단 | `oliveyoung-global-best-1·2`, `zigzag-home-2·3`, `musinsa-ranking-1·2`(3열) | §4-③ 그리드. 순위 사각 대신 **큰 숫자**로 차별 |
| 1위를 크게, 2·3위 나란히, 4위부터 줄 | `hwahae-home-1`(1위 히어로 1/10) → 목록 | §4-② 비대칭 랭킹 |
| 스티커 뱃지(올영 PICK 원형, NEW 분홍, 급상승 빨강) | `oliveyoung-global-best-2`, `zigzag-home-2`, `musinsa-ranking-2` | NEW 스티커 하나만, 체리, 살짝 기울임 |
| 세그먼트·알약 칩: 선택은 검정/브랜드 채움, 피부 타입 칩으로 개인화 랭킹 | `oliveyoung-global-best-1`, `hwahae-home-2`("내 피부에 꼭 맞는"), `musinsa-ranking-2` 하단 떠 있는 세그먼트 | 홈 칩 그대로 재사용, 피부 타입 칩 → 어워드 재정렬 |
| 가로 스냅 레일 Top 10(카드 ≈140px, 순위 사각) | `glowpick-home-3` | §4-⑪ 교차 레일, `/drama` "지금 화제" |
| 반응 수: "128人が保存しました"·♡138·💬2, 하트 밑 "1.1만", "131명이 보는 중", ★4.9(24,045) | `lemon8-beauty-jp-3`, `29cm-home-2`, `musinsa-ranking-1`, `zigzag-home-2` | 실제 집계만: 투표 수·별점 수. 저장 수는 서버가 없어 안 보인다 |
| 테스트가 콘텐츠: 顔型診断 커버, 결과 공유 | `lemon8-beauty-jp-1·2` | 피부 타입 테스트 CTA 카드 + 결과 히어로 |
| 에디토리얼 블록: 큰 제목 + 한 줄 + 제품 줄 3개(브랜드 회색·이름·가격·하트+수) | `29cm-home-2·3` | 제품 상세 "같은 분류 3개", 동네 "명소 4개" |
| 상세 숫자 줄: ★ 4.9 (1,215) · 가격 색 하나 | `creatrip-home-1·2` | 별점 평균 굵게 + 수 회색, 가격은 잉크(빨강 아님) |
| 인물 칩 = 아바타 + 이름 알약 | `weverse-home-1` | 드라마 출연·관련 인물 칩 |
| 피할 것: 앱 설치 배너·언어 바·쿠폰 띠가 첫 화면 상단 60~120px 점유, 하단 반 가림 | `lemon8-*`, `glowpick-home-1`, `zigzag-home-1`, `musinsa-ranking-1`, `kagit-home-1` | 첫 화면 침범 0 |

바텀시트·하트 팝·도장 찍기는 웹 캡처로 못 봤다(앱 관례: 인스타 하트 팝 300ms, 토스 바텀시트). 우리 `BottomSheet`·`press` 유틸이 이미 그 문법이다.

## 3. 토큰

### 지금 토큰으로 되는 것

면 `bg/card/band/floating`, 잉크 4단, `brand/brand-ink/brand-weak/cherry`, 틴트 `--tint-kbeauty`(뷰티) · `--tint-travel`(여행) · `--tint-kdrama`(드라마), `on-tint/on-tint-sub/tape`, 글자 `t1…st13`, 모서리 `badge/btn-m/btn/card/dialog/sheet`, `shadow-card/float`, `press/press-soft/press-row/hit`, `.rail/.rail-snap`, `.tape`, `animate-toast-in/fade-in/burst`, `ease-expo`, `--bottom-ui`.

### 꼭 새로 필요한 토큰 (통합자가 `globals.css` 에 넣는다)

| 이름 | 라이트 | 다크 | 왜 |
|---|---|---|---|
| `--tint-clinic` (+`--color-tint-clinic`) | `oklch(0.94 0.025 240)` | `oklch(0.33 0.035 240)` | 클리닉 섹션 색. 채도를 반으로 낮춘 '가운 흰색에 가까운 하늘' — 뷰티 분홍·드라마 보라·여행 초록 옆에서 '의료는 차분' 으로 읽힌다. wh(245)와 색상은 가깝지만 채도가 달라 구분된다 |
| `--on-tint-ghost` (+`--color-on-tint-ghost`) | `rgba(27, 21, 32, 0.1)` | `rgba(246, 239, 243, 0.1)` | 타이포 커버의 '유령 글자'(잘려 나간 큰 이니셜·숫자) 색. `on-tint-sub` 처럼 틴트 위 전용 투명 잉크 |
| `--text-display` / `--text-display--line-height: 1` | `clamp(44px, 2.5882rem, 60px)` | 같음 | 순위 1·2·3, 별점 평균, 도장 수 n/4, 테스트 결과 타입 이름. t1(30px)로는 '숫자가 주인공' 이 안 된다 |
| `--text-poster` / `--text-poster--line-height: 1` | `clamp(96px, 5.6471rem, 120px)` | 같음 | 커버 유령 글자(히어로·3:4). 잘려서 보이므로 큰 글자에서도 레이아웃이 안 밀린다 |
| `@keyframes heart-pop` + `--animate-heart-pop: heart-pop 320ms var(--ease-expo) both` | `0% scale(1) → 30% scale(1.35) → 55% scale(.92) → 100% scale(1)` | — | 하트 팝. 기존 reduced-motion 블록(1ms)이 그대로 덮는다 |
| `@keyframes stamp-in` + `--animate-stamp-in: stamp-in 260ms var(--ease-expo) both` | `from rotate(-12deg) scale(1.6) opacity 0 → 60% opacity 1 → to rotate(-12deg) scale(1)` | — | 도장 찍기 |
| `--color-tape: var(--tape)` (`@theme inline` 한 줄) | 기존 `--tape` | 기존 | `--tape` 는 `.tape::before` 에서만 쓰여 `bg-tape` 유틸리티가 없다. 커버 위 하트 받침에 필요 |
| `.numeral` (클래스, 토큰 아님) | `font-family: var(--font-display); font-style: italic; font-weight: 400; letter-spacing: -0.04em; font-variant-numeric: tabular-nums` | — | **순위 1·2·3 숫자와 "No." 에만** 로고 서체. 'Unnie.' 의 기울인 세리프가 숫자에서 다시 나오면 템플릿이 아니라 우리 것이 된다. TSX 에서 `font-display`·`italic` 직접 사용은 계속 린트가 막는다. 통합자가 거부하면 `font-bold tracking-tighter tabular-nums` 로 대체 |

새 글자 크기 2개는 `@theme` 에, 틴트·고스트는 `:root`·다크·`@theme inline` 3곳에. 그 밖의 색·크기·그라데이션은 추가하지 않는다.

## 4. 공통 부품 명세

### ① `TypeCover` — 사진 없는 커버

```
<div class="relative overflow-hidden rounded-card text-on-tint {ratio}" style="background-color: var(--tint-{section})">
  <span aria-hidden class="pointer-events-none absolute -right-3 -bottom-5 select-none text-poster font-bold tracking-tighter tabular-nums text-on-tint-ghost">{glyph}</span>
  <Badge tone="paper" class="absolute top-2.5 left-2.5">{label}</Badge>
  {sticker: <Badge tone="brand" class="absolute -top-1 -right-1 -rotate-6 shadow-float">NEW</Badge>}
  <div class="absolute inset-x-3 bottom-3">
    <p class="title line-clamp-2 text-t5 font-bold leading-row">{title}</p>
    <p class="mt-0.5 truncate text-st12 font-semibold text-on-tint-sub">{sub}</p>
  </div>
</div>
```

| 변형 | 비율 클래스 | 쓰는 곳 | glyph | label | sub |
|---|---|---|---|---|---|
| `grid` | `aspect-[3/4]` | 2열 그리드, 레일(`w-36`) | 아래 표 | 분류 | 브랜드·동네·연도 |
| `square` | `aspect-square` | 랭킹 행·목록·저장함 썸네일(`size-16`, `rounded-btn-m`, 유령 글자 `text-display`, 제목 없음) | 아래 표 | 없음 | 없음 |
| `hero` | `aspect-[4/3] rounded-none` 전폭, pushed 헤더 바로 아래 | 상세 첫 화면 | 아래 표, `-right-4 -bottom-8` | 분류 | 없음(제목은 커버 밖 h1) |
| `tile` | `aspect-[5/4]` | `/guide` 허브 4타일, `/travel` 동네 9타일 | 섹션 이니셜·동네 한 글자 | 없음 | 한 줄 + 개수 |

| 섹션 | 틴트 | glyph 규칙 |
|---|---|---|
| 뷰티 | `--tint-kbeauty` | 브랜드 라틴 이니셜 1~2자(COSRX→"C", Beauty of Joseon→"BJ") |
| 여행 | `--tint-travel` | 동네 첫 글자: ja·zh·ko 는 한자/가나/한글 1자(弘·聖·成), 그 밖은 라틴 2자(HD·SS) |
| 클리닉 | `--tint-clinic` | 회복 일수 "3d" 또는 횟수 "1×" — 숫자가 사실 표를 예고한다 |
| 드라마 | `--tint-kdrama` | 회차 "16" (label "EP"), 영화는 연도 두 자리 "'26" |

유령 글자는 반드시 잘린다(우하단 밖으로). 글자가 통째로 보이면 '아이콘 카드' 가 된다. 제목은 `<Phrase>` 로 CJK 줄바꿈.

### ② `RankRow` + 비대칭 랭킹

```
<ol class="px-gutter grid grid-cols-2 gap-3">
  <li class="col-span-2"> 1위: flex gap-4 rounded-card bg-card p-4 shadow-card — 왼쪽 TypeCover grid w-32, 오른쪽: <span class="numeral text-display text-ink-900">1</span> + 브랜드 text-st12 text-ink-600 + 이름 text-t4 font-bold leading-row line-clamp-2 + 메타 + SaveButton icon(우상단) </li>
  <li> 2위·3위: TypeCover grid, 커버 왼쪽 위에 <span class="numeral text-display absolute top-1 left-3 text-on-tint">2</span> (label 뱃지 대신) </li>
</ol>
<ul class="mt-2"> 4위~: ListRow inset="gutter" left={<span class="w-8 text-center text-t4 font-bold tabular-nums text-ink-600">4</span> + TypeCover square size-14} title={이름} sub={브랜드 · ₩ · 피부 칩} right={<SaveButton variant="icon"/>} </ul>
```

- 변동 화살표 없음(첫 집계). 새로 들어온 것만 `NEW` 스티커(①).
- 1위 카드에 산식 한 줄: `text-st12 text-ink-600` "조회·저장·투표로 매김 · 10.19 갱신". 전문용어·가중치 % 금지.
- 10위 밖은 "전체 보기" `SectionHeader href`.

### ③ 2열 카드 그리드

`grid grid-cols-2 gap-3 px-gutter`, 카드 = `<Link class="press-soft block">` + TypeCover `grid` + 아래 `mt-2 text-t6 font-bold leading-row line-clamp-2` 제목(커버 안 제목과 중복이면 커버 안 제목만) + `text-st12 text-ink-600 tabular-nums` 메타. 하트는 커버 우하단 `absolute right-1.5 bottom-1.5` (IconButton + `bg-tape`).

| 2열 그리드 | 목록(`ListRow`) |
|---|---|
| 둘러보기가 목적: 어워드 2·3위, 같은 분류 제품, 동네 타일, 드라마 가이드 24, 저장함 '뷰티·드라마' 탭 | 순서·비교가 목적: 랭킹 4위~, 시술(의료는 차분하게), 명소 4개(역·도보 분 등 메타 3개 이상), 저장함 전체·시술 탭, 음원 차트 |
| 항목 ≤ 24, 메타 ≤ 2 | 항목 수 제한 없음, 메타 3+ |

### ④ 하트 · 저장 토스트 · 하트 팝

- `SaveButton variant="icon"`: `IconButton` 44px, `HeartIcon` → 저장되면 `HeartFilledIcon class="text-brand animate-heart-pop"` (key 를 바꿔 다시 재생). 커버 위에서는 `bg-tape`, 헤더에서는 맨 색.
- `variant="chip"`: `Button size="m" variant="weak"` "저장" ↔ `variant="neutral"` "저장됨".
- 토스트: 처음 저장 때만 `toast(t("savedToast"), { href: "/saved", actionLabel: t("savedOpen") })` 5초. 해제는 토스트 없음.
- 저장 수는 표시하지 않는다(로컬 저장). 투표 수·별점 수만.
- reduced-motion: 전역 규칙이 1ms 로 줄인다. 추가 처리 없음.

### ⑤ `VoteChips` + 결과 막대

```
<p class="text-t5 font-bold">써 봤어요?</p>
<div class="mt-3 flex flex-wrap gap-2"> Button size="m" variant="neutral" ×3 (인생템 / 괜찮음 / 별로) — 내 선택은 variant="primary" </div>
투표 뒤(또는 집계 ≥1): 
<ul class="mt-3 flex flex-col gap-2">
  <li class="grid grid-cols-[6rem_1fr_3rem] items-center gap-2">
    <span class="text-t6 font-semibold truncate">인생템</span>
    <span class="h-2 rounded-full bg-fill-weak"><span class="block h-full rounded-full bg-ink-900 transition-[width] duration-500 ease-expo" style="width:62%"/></span>
    <span class="text-t6 font-bold tabular-nums text-right">62%</span>
  </li>
</ul>
<p class="mt-2 text-t7 text-ink-600">건성 92%가 인생템 · 128표</p>
```
내 선택 막대만 `bg-brand`. 0표면 막대 대신 `text-t7 text-ink-600` "첫 번째로 평가해 보세요". facet 칩(피부 타입)이 없으면 투표 직후 `BottomSheet` 로 타입 1번 묻는다.

### ⑥ `StarVote`

`<span class="numeral text-display text-ink-900">4.6</span>` + `text-t7 text-ink-600 tabular-nums` "(312)" 를 왼쪽, 오른쪽에 별 5개 `button class="hit size-8"` — 채움 `text-brand`, 빈 별 `text-line-strong`(노랑 별 금지). 반 별 없음, 평균은 소수 1자리. 내 별점 뒤 `text-t7 text-ink-600` "내 별점 4". `count < 5` 면 평균 대신 "평가 n개".

### ⑦ 테스트 (`/beauty/skin-type`)

- 진행 점: `flex gap-1.5` × 6, `h-1.5 w-6 rounded-full bg-line-strong`, 지난 문항 `bg-brand`.
- 문항: `text-t3 font-bold text-ink-900` (`text-balance` 는 h 태그 기본). 보기: `Button size="xl" variant="neutral" block` 세로 `gap-2`, 고르면 `variant="weak"` 150ms 뒤 다음 문항(`animate-fade-in`). "뒤로" 는 `Button size="m" variant="neutral"`.
- 결과: TypeCover hero(틴트 kbeauty, glyph = 타입 코드 "DRY") → `h1 class="text-display font-bold"` 타입 이름 + `text-t5 text-ink-700` 한 줄 → `Button variant="primary"` 공유 + `variant="neutral"` 다시 하기 → "이 타입을 위한 제품" ③ 그리드. 광고 없음. "재미용·의학 진단 아님" `text-st12 text-ink-600`.

### ⑧ 도장 (`가 봤어요`)

- 버튼: `Button size="l" variant="weak" block` "가 봤어요" → 찍히면 버튼 자리에 `<span class="animate-stamp-in inline-grid size-16 -rotate-12 place-items-center rounded-full border-2 border-brand-ink text-brand-ink"><span class="text-st13 font-bold uppercase tracking-wider">Visited</span><span class="text-st12 tabular-nums">10.19</span></span>` + 옆에 `Button size="m" variant="neutral"` "취소".
- 진행: 동네 화면 `text-display font-bold tabular-nums` "2" + `text-t5 text-ink-600` "/4 가 봤어요" + `h-1.5 rounded-full bg-fill-weak` 안 `bg-brand` 막대. 타일에는 `Badge tone="paper"` "2/4".
- 4/4 가 되면 `animate-burst`(기존 D-0 폭죽) 한 번.

### ⑨ `AffiliateBox` — PR 상자

`mx-gutter rounded-card bg-card p-4 shadow-card` (콘텐츠 카드와 같은 면). 첫 줄 `flex items-center gap-2`: `Badge tone="neutral"` "PR" + `text-st12 text-ink-600` 고지(링크 `/disclosure`). 둘째 줄 `text-t5 font-bold` "어디서 사나". 항목 `ListRow inset="card" external` (파트너 이름 · 배송 지역 sub). 브랜드 색·채운 버튼 없음 — 색이 없어서 광고로 안 보이고, PR 이 첫 줄이라 숨기지 않는다. `compact` 는 제목 없이 줄 2개.

### ⑩ 섹션 허브 머리

`px-gutter pt-6`: `h1 class="text-st2 font-bold text-ink-900"` + `p class="mt-1 text-t6 text-ink-600"` 한 줄 + `p class="mt-1 text-st12 text-ink-600 tabular-nums"` 갱신·산식 한 줄 → `div class="rail mt-4 -mx-gutter gap-2 px-gutter"` 칩(홈과 같은 모양: `press min-h-9 rounded-full px-3.5 text-t6 font-semibold bg-card shadow-card text-ink-700`, 선택 `bg-brand text-white`). 칩은 가로 스크롤, 줄바꿈 없음.

### ⑪ `CrossRail`

`SectionHeader` + `div class="rail rail-snap gap-3 px-gutter"` 안 `w-36` TypeCover grid 카드 3~4개(다른 섹션 틴트가 섞여 '여기서 저기로' 가 색으로 보인다). 끝에 `w-36` "더 보기" 카드(`bg-fill-weak`).

### ⑫ 광고 칸

`<div class="bg-band py-2"><AdSlot label=… /></div>` — 띠 안에 있어 본문과 분리. 화면당 최대 1, 첫 화면 금지, 투표·별점·도장·구매 상자·다음 버튼과 바로 이웃 금지(사이에 콘텐츠 블록 1개 이상). `min-h-[280px]` 로 자리 고정.

## 5. 화면별 첫 화면 (390×844, 스크롤 0, 헤더 56 + 탭바 68 제외 ≈ 720px)

| 화면 | 위에서 아래 (어림 높이) | 첫 행동 | 첫 화면 금지 |
|---|---|---|---|
| `/guide` | h1 "가이드" + 한 줄(80) → 타일 2×2 `grid-cols-2 gap-3` TypeCover tile(뷰티·여행·클리닉·드라마, 각 ≈167, 총 350) → `SectionHeader` "지금 인기" + 첫 줄(120) | 타일 탭 / 인기 첫 항목 하트 | 테스트 CTA(아래로), 광고 |
| `/beauty` | ⑩ 머리 + 분류 칩(150) → 1위 히어로 카드(170) → 2·3위 그리드 상단(≈250 중 200) | 1위 하트 | 제휴 상자, 광고 |
| `/beauty/p/[slug]` | pushed 헤더(하트·공유) → TypeCover hero 4:3(292) → h1 `text-t3` 이름 + 브랜드 `text-t6 text-ink-600` + ₩ `text-t5 font-semibold tabular-nums` + "어디서 사나 ↓" 앵커(100) → 피부 타입·성분 칩(44) → ⑤ 질문 + 칩 3개(120) | 투표 | 제휴 상자 본체(앵커만), 광고 |
| `/beauty/skin-type/[type]` | pushed → hero(292) → 타입 이름 `text-display` + 한 줄(110) → 공유·다시 하기(56) → "이 타입을 위한 제품" 머리 + 그리드 첫 줄 상단(150) | 공유 | 광고 |
| `/travel` | ⑩ 머리(120) → 동네 타일: 첫 타일 `col-span-2 aspect-[2/1]`(175) + 2열 2개 상단(≈200) | 타일 탭 (도장 n/4 보임) | 여행 준비 상자, 광고 |
| `/travel/place/[slug]` | pushed(하트·공유) → hero(292) → h1 + 동네 · 종류(70) → 요약 2줄(50) → `ListRow` "가까운 역 · 도보 n분"(56) → "지도에서 열기" neutral + ⑧ 도장 버튼 나란히(56) | 도장 | 광고, 제휴 |
| `/clinic/[slug]` | pushed(하트·공유) → **커버 없음**: `size-16` square 커버 + h1 + aka + 분야 `Badge tone="tint" tint=clinic`(90) → 의료 고지 `bg-band rounded-card px-4 py-3 text-t7 text-ink-700`(64) → 사실 표 `grid grid-cols-3 gap-2`(회복·통증·소요·횟수·수술여부, 값 `text-t4 font-bold tabular-nums`, 이름 `text-st12 text-ink-600`)(150) → what 첫 문단(120) | 저장(헤더 하트) | 투표(아래), 광고, 가격 |
| `/drama` | ⑩ 머리 + 장르 칩(150) → "지금 화제" 레일 `w-36` 3:4 카드 2.5장(240) → "한국에서 지금 듣는 노래" 머리 + 1~3위 `ListRow`(순위 `text-t4 font-bold tabular-nums`, 제목·가수, 외부 아이콘)(230) | 레일 카드 하트 | 광고 |
| `/drama/[slug]` | pushed(하트·공유) → hero(292) → h1 + 연도·회차·방송사 `Meta` + 장르 칩(100) → ⑥ 별점(72) → "어디서 보나" 플랫폼 `Badge tone="neutral"` 줄 + 지역(60) | 별점 | 광고, 촬영지(아래) |
| `/saved` | h1 "저장함" + `text-ink-400` 개수(60) → 종류 칩(44) → `ListRow` 5줄(square 커버 `size-14`, 제목, 종류 · sub, right = `IconButton` ×)(280) → 빈 상태면 `EmptyMemo`(틴트 kbeauty) + `Button variant="weak"` "가이드 둘러보기" | 해제 / 둘러보기 | 광고(아예 없음) |

공통: 상세는 `AppHeader variant="pushed"` + `action={<SaveButton variant="icon"/><ShareButton/>}`, 섹션 사이 `bg-band h-4` 띠, 하단 `CrossRail` → 그 위에 광고 띠(⑫).

## 6. 9개 언어

- **CJK 줄바꿈**: 제목은 `<Phrase>`(budoux) + 전역 `line-break: strict`. 커버 안 제목 `line-clamp-2`, 타일 제목은 `line-clamp-1`.
- **긴 라벨(ru·fr·vi·id)**: 칩·버튼은 고정 폭 금지(`min-h` 만). 투표 칩 3개는 `flex-wrap` 으로 2줄 허용. `/saved` 종류 칩과 ⑩ 칩 레일은 가로 스크롤. 탭 라벨은 `TabBar` 의 `min-w-[4.5rem]` 안에서 `text-chrome-tab` 한 줄 — Гид·Моё·Favoris·Cẩm nang 확인(`Cẩm nang` 은 2단어라 `whitespace-nowrap`).
- **대문자·자간**: `uppercase tracking-wider` 는 라틴 전용(도장 "VISITED", 뱃지 "NEW"·"PR"). vi 성조·ru 키릴에는 `tracking` 을 걸지 않는다. CJK 라벨은 `uppercase` 무효이므로 같은 뱃지가 한 줄 더 높아지지 않게 `min-h-6` 유지.
- **숫자**: 순위·별점·%·₩·n/4 전부 `tabular-nums`. 통화·천 단위는 `Intl.NumberFormat(locale)`, ₩ 표기는 ko 외에도 `₩` 그대로(현지 통화 환산 안 함). 날짜는 `Intl.DateTimeFormat`.
- **유령 글자**: ja·zh·ko 는 1자, 그 밖은 라틴 2자. 키릴·베트남어 이니셜은 쓰지 않는다(라틴 브랜드명·동네 로마자).
- **공유 OG**: 라틴 글자만("I'm DRY skin · Unnie Note").
- **긴 글자 설정(AX)**: 모든 높이는 `min-h`, 커버는 유령 글자가 잘리므로 비율 유지, 1위 카드는 `flex-wrap`.

## 7. 하지 말 것 — AI 템플릿 냄새 12

1. 보라→분홍(또는 어떤 두 색이든) 그라데이션 배경·버튼·글자.
2. 이모지 아이콘(🔥✨💄📍) — 섹션 제목·칩·빈 상태 어디에도.
3. "틴트 정사각 + 라인 아이콘 + 제목 + 한 줄" 카드(케이아지트 랭킹 허브 `kagit-ranking-1`).
4. 다색 누적 막대·5색 점수 뱃지(`kagit-article-2`). 막대는 잉크 한 색 + 내 선택 체리.
5. 금·은·동 메달 아이콘·트로피(`hwahae-home-1`). 순위는 숫자뿐.
6. 노란 별 5개 클립아트. 별은 체리, 빈 별은 선 색.
7. 같은 높이 흰 카드 3열 격자 + 회색 그림자(SaaS 랜딩).
8. 반투명 유리 카드(backdrop-blur 면). 블러는 `bg-tape` 하트 받침과 상단바뿐.
9. 영문 장식 소제목 "Discover · Explore · Trending Now 🚀", 대문자 자간 라틴 eyebrow 를 CJK 화면에.
10. 일러스트 빈 상태(undraw 풍 사람 그림)·스켈레톤 반짝임. 빈 상태는 `EmptyMemo`.
11. 첫 화면 상단 앱 설치 배너·언어 제안 바·쿠폰 띠(`lemon8-*`, `glowpick-home-1`, `kagit-home-1`).
12. 가짜 긴급(마감·재고·"n명이 보는 중" 추정치). 숫자는 실제 집계만, 0은 0.

## 8. 케이아지트 대비 '이긴다' 체크리스트 (구현 후 390×844 캡처로 예/아니오)

| # | 판정 | 케이아지트 |
|---|---|---|
| 1 | 10개 화면 모두 스크롤 0 에 광고·앱 배너·언어 바가 0개 | 언어 바 1 + 2화면째 광고 |
| 2 | 10개 화면 모두 스크롤 0 에 누를 수 있는 참여 행동(하트·투표·별점·도장·공유) ≥ 1 | 0 |
| 3 | 네트워크 이미지 0장으로도 모든 카드·히어로가 빈 곳 없이 그려진다(개발자 도구 이미지 차단 캡처) | 사진 없으면 빈 카드 |
| 4 | `/beauty` 첫 화면에서 1위 숫자 글자 높이 ≥ 44px, 2초 안에 1위 식별(캡처 눈대중) | 점수 69 뱃지 ≈ 18px |
| 5 | 한 화면의 유채색이 틴트 1 + 체리 1 이하(캡처 색 세기) | 랭킹 행 5색 |
| 6 | 산식 설명이 한 줄·전문용어 0(가중치 %·축·筆 없음) | "KR 30% GL 30% … 已測 4/4 軸" |
| 7 | 제품·명소 상세에 "어디서 사나/가나" 외부 행동이 있고 PR 뱃지가 첫 줄 | 없음 |
| 8 | 하단 탭에 '저장' 이 있고 로그인 없이 저장·해제·공유 링크가 된다 | 我的 = 로그인 |
| 9 | ru·fr·vi 에서 탭 라벨·칩·투표 칩이 잘리지 않는다(3개 언어 캡처) | 번체·일본어만 |
| 10 | 다크 모드 캡처에서 틴트가 진흙색이 아니고 유령 글자가 보인다 | 미확인(캡처 못 함) |
| 11 | 첫 화면 본문 글자 최소 15px(`t6`), 메타 12px 이상 | 메타 ≈ 11px |
| 12 | 이모지·그라데이션·메달·다색 막대 0건(§7 전부) | 다색 막대·틴트 아이콘 |

## 9. 결정 요약

1. 사진 대신 **유령 글자 타이포 커버** — 잘린 큰 이니셜·숫자 + 틴트 + 작은 라벨. 섹션은 틴트와 glyph 규칙으로만 달라진다.
2. 랭킹은 **1위 전폭 카드 → 2·3위 2열 → 4위~ 목록**, 숫자는 로고 서체 `.numeral`(허용 안 되면 SF 굵게).
3. 변동 화살표 없이 **NEW 스티커** 하나, 체리, 기울임.
4. 색은 틴트 1 + 체리 1 + 잉크. 새 틴트는 클리닉 하나(저채도).
5. 별·막대·도장·하트 전부 **체리 한 색**, 노랑·초록·메달 없음.
6. 첫 화면 = 행동 1 · 광고 0. 광고는 `bg-band` 띠 안, 화면당 1.
7. 제휴는 콘텐츠 카드와 같은 면 + PR 첫 줄. 채운 버튼 없음.
8. 2열 그리드는 둘러보기, 목록은 비교·의료·3+메타. 클리닉 상세는 히어로 커버 없이 사실 표부터.
