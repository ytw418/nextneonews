# 언니노트 수익화 확장 설계서 (2026-10-19 19:00 → 23:30, dev)

근거: `.local/map/*.md`(코드 지도), `docs/research/monetize-2026-10/*.md`(제휴·법·심리·데이터), `docs/revenue.md`, `docs/PRD.md` §2·§7·§9·§12, `docs/goal-monetization.md`. 경로는 저장소 루트 기준, `src/`는 `apps/web/src/`.

## 0. 핵심 결정 10줄

1. 돈은 **제휴(뷰티·여행) → 협찬 문의 → 광고 RPM** 순으로 난다. 구현 순서도 그 순서다. 의료는 광고만, 드라마·케이팝은 유입용이다.
2. 하단 탭 4개: **홈 · 랭킹 · 가이드(`/guide`) · 저장(`/saved`)**. 일정은 홈 레일·메뉴로 내린다.
3. 새 섹션 4개: `/beauty`(제품 50 + 언니 어워드 + 피부 타입 테스트), `/travel`(동네 9 · 명소 36), `/clinic`(시술 22, 병원 목록 없음), `/drama`(가이드 24 + 케이팝 지금 듣는 노래).
4. 콘텐츠는 전부 **정적 카탈로그 파일**(`src/data/*`)이고 9개 언어 문구는 언어별 JSON을 서버에서만 읽는다. AI 파이프라인 호출 0회.
5. DB 변경은 **`ItemVote` 테이블 하나**(평가·관심 투표·별점 공용). 테이블이 없어도 페이지는 0 표시로 산다.
6. 저장은 `hb:saved` 한 키(종류·id·시각 배열, 300개 상한) + `useSyncExternalStore`. 공유 링크로 복원할 수 있다.
7. 제휴 링크는 `lib/affiliate.ts` 한 곳에서 만든다. 환경변수가 비면 일반 링크, 있으면 추적 링크. 모든 링크 `rel="sponsored nofollow noopener"` + 'PR' 배지 + 9개 언어 고지 문장(상자 첫 줄).
8. 의료 페이지: 제휴 상자 금지(코드가 throw), 쿠팡 금지, 애드센스 1칸만. 병원명·후기·전후 사진·병원 순위 없음.
9. 피부 타입 테스트 하나만 만든다(퀴즈 엔진은 공용). 동네·드라마 테스트, 넷플릭스 TSV 파서, 주간 순위 변동 배지는 이번 범위 밖.
10. 에이전트 9개: 기반 2개(P0a·P0b, 먼저) → 병렬 7개(P1~P7) → 통합·검사·리뷰.

## 1. 사업 판단 — 초안 다시 매기기

| 순위 | 항목 | 돈 | 판단 |
|---|---|---|---|
| 1 | 공용 기반(저장·제휴 모듈·평가 API·탭) | 전부의 전제 | 먼저, 두 에이전트가 50분 안에 |
| 2 | K-뷰티 제품·어워드·상세·피부 타입 테스트 | 제휴 1순위(올리브영 글로벌 13%, YesStyle 10%, Amazon 3~10%) + 제품명 롱테일 검색 | 초안 유지. 60~80개 → **50개**로 줄여 정확도 확보 |
| 3 | 여행(동네·명소·여행 준비 상자) | 제휴 2순위(Klook eSIM 20%, 투어 6.5%, Creatrip 8%). 촬영지·아이돌 성지가 연예 유입을 돈으로 바꾸는 다리 | 초안 유지. 경로는 `/travel`(부산·제주 포함이라 `/seoul` 부적합). 명소 36개 |
| 4 | 수익 장치: 제휴 고지 페이지·`/partners`·구조화 데이터·사이트맵·쿠팡 호스트 수정 | 협찬이 revenue.md 기본 M12 매출의 30% — 가장 큰 레버. 구조화 데이터는 검색 노출 | 초안 유지, 한 패키지로 묶음 |
| 5 | 클리닉 시술 사전 | 애드센스만(제휴 불가). 치과 CPC $8·뷰티 $4.6로 높지만 승인·Vercel Pro 여부 미확인 → 지금은 검색 자산 | 유지하되 22개. 병원 목록·후기·순위 없음. 광고 1칸 |
| 6 | 드라마 허브·케이팝 지금 듣는 노래 | 직접 수익 거의 없음. 유입 + 촬영지(여행) 연결 | 가이드 30 → **24편**. 넷플릭스 TSV 파서는 파일이 없어 **범위 밖**(사장님이 주 1회 받아야 함). 애플 RSS 레일은 DB 없이 `fetch` 재검증으로 싸게 |
| 7 | 테스트 3종 | 피부 타입 테스트만 제휴 클릭으로 이어진다 | 피부 타입 1개만. 결과 공유 OG 이미지 포함 |
| 8 | 주간 순위 변동 배지 | 첫날 이력이 없어 거짓 신호 | **뺀다.** 대신 `addedAt` 14일 이내 'NEW' 배지 |
| 9 | 저장 수 진행 표시·'가 봤어요' 도장 | 소유·진행 심리, 비용 작음 | 유지 |

뺀 것: 넷플릭스 순위, 동네·드라마 테스트, 순위 변동 배지, 자유 글 리뷰, 병원 목록. 더한 것: `/disclosure`(제휴 고지 전용 페이지, PRD 9.3 필수), 기존 글 페이지에 저장 버튼·교차 레일, 홈 '가이드' 레일.

## 2. 정보 구조와 라우트

모든 화면은 `src/app/[locale]/` 아래. slug는 `^[a-z0-9-]{2,64}$`(점 금지, `proxy.ts` matcher 때문). 광고 라벨은 기존 `Article.ad`, 슬롯은 `process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDE ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE`.

| 경로 | 생성 | revalidate | 메타·JSON-LD | 광고 칸 | 소유 |
|---|---|---|---|---|---|
| `/guide` | 정적 | 3600 | CollectionPage(4 섹션) + Breadcrumb | 맨 아래 1 | P0b |
| `/saved` | 클라이언트, `robots: pageRobots(false)` | — | 없음 | 없음 | P0a |
| `/beauty` | 정적 | 3600 | CollectionPage + ItemList(분류별 1위) | 맨 아래 1 | P1 |
| `/beauty/awards/[category]` | `generateStaticParams` 전체, `dynamicParams=false` | 3600 | ItemList(Product) + Breadcrumb | 목록 끝 1 | P1 |
| `/beauty/p/[slug]` | 전체 열거, `dynamicParams=false` | 3600 | Product(+AggregateRating은 표 5개 이상일 때만) + Breadcrumb | 본문·평가·구매 상자 뒤, 교차 레일 앞 1 | P1 |
| `/beauty/skin-type` | 정적 | 3600 | WebPage | 없음(문항 중 광고 금지) | P1 |
| `/beauty/skin-type/[type]` | 5개 열거 | 3600 | WebPage + ItemList(추천) · `opengraph-image.tsx` | 추천 목록 아래 1 | P1 |
| `/travel` | 정적 | 3600 | CollectionPage + ItemList(동네) | 여행 준비 상자 아래 1 | P3 |
| `/travel/[area]` | 9개 열거 | 3600 | ItemList(TouristAttraction) + Breadcrumb | 목록 끝 1 | P3 |
| `/travel/place/[slug]` | 전체 열거 | 3600 | TouristAttraction + Breadcrumb | 팁 뒤 1 | P3 |
| `/clinic` | 정적 | 3600 | CollectionPage + Breadcrumb | 맨 아래 1 | P5 |
| `/clinic/[slug]` | 22개 열거 | 3600 | FAQPage + Breadcrumb (MedicalProcedure 안 씀 — 의료 권위 암시 회피) | FAQ 뒤 1 (관심 투표 칩과 한 화면 이상 떨어짐) | P5 |
| `/clinic/how-to-choose` | 정적 | 3600 | WebPage + Breadcrumb | 맨 아래 1 | P5 |
| `/drama` | 정적 | 3600 | CollectionPage + ItemList | 가이드 목록 뒤 1 | P6 |
| `/drama/[slug]` | 24개 열거 | 3600 | TVSeries + Breadcrumb | 촬영지 뒤 1 | P6 |
| `/partners` | 정적 | 3600 | WebPage(Organization 연락처) | 없음 | P7 |
| `/disclosure` | 정적 | 3600 | WebPage | 없음 | P7 |
| `POST /api/items/[kind]/[itemId]/vote`, `GET /api/items/[kind]/[itemId]` | 동적 | no-store / s-maxage=300 | — | — | P0a |
| `GET /api/saved?items=&locale=` | 동적 | s-maxage=300 | — | — | P0a |

메타는 `rankings/page.tsx:28-49` 패턴 그대로(`localeAlternates`, `ogBase`, `pageRobots`, `images: [\`${localeHomePath(locale)}/opengraph-image\`]`). `setRequestLocale` 첫 줄, `isLocale` 검사.

## 3. 데이터 모델

### 3-1. 정적 카탈로그 (서버 전용)

위치 `src/data/<section>/`. 세 파일: `types.ts`(P0b), `items.ts`(언어 무관 사실, 데이터 패키지), `text/{locale}.json`(언어별 문구, 데이터 패키지), `index.ts`(로더, P0b). `index.ts` 첫 줄 `import "server-only";`(P0b가 `apps/web`에 `server-only` 의존성 추가). 클라이언트 컴포넌트는 카탈로그를 import 하지 않고 props로 받는다 → 번들에 안 실린다. 언어별 JSON은 `await import(\`./text/${locale}.json\`)`(`InfoPage.tsx:29` 패턴)로 요청 언어 것만 읽는다.

```ts
// src/data/types.ts  (P0b)
import type { Locale } from "@kmedia/core";
export type Section = "beauty" | "travel" | "clinic" | "drama";
export type SavedKind = "article" | "beauty" | "place" | "clinic" | "drama";
export type Region = "tw" | "hk" | "jp" | "us" | "sg" | "my" | "ph" | "id" | "vn" | "fr" | "global";
export type AffiliatePartner = "oliveyoung" | "yesstyle" | "amazon" | "klook" | "creatrip" | "trip" | "airalo";
export interface AffiliateTarget { partner: AffiliatePartner; url: string; regions?: Region[] } // url = 파트너 사이트의 보통 주소
export interface CatalogSummary {
  kind: SavedKind; id: string; href: string; // href 는 언어 접두사 없는 앱 경로 (/beauty/p/x)
  title: string; sub?: string; tint: string; // tint: "var(--tint-kbeauty)" 처럼 CSS 변수
  badge?: "new";
}

// src/data/beauty/types.ts
export type PriceTier = 1 | 2 | 3; // ₩ · ₩₩ · ₩₩₩ (₩=1만 원 미만, ₩₩=1~3만, ₩₩₩=3만 이상, 한국 정가 기준)
export type SkinType = "dry" | "oily" | "combination" | "sensitive" | "normal";
export type BeautyCategory = "cleanser" | "toner" | "serum" | "moisturizer" | "sunscreen" | "mask" | "lip" | "base" | "eye" | "hair-body";
export interface BeautyProduct {
  slug: string; brand: string; // 브랜드 영문 표기 (언어 무관)
  category: BeautyCategory; skinTypes: SkinType[]; priceTier: PriceTier;
  keyIngredients: string[]; // INCI 영문, 최대 4
  functional?: ("whitening" | "wrinkle" | "sun")[]; // 식약처 기능성 보고 제품만. 없으면 효능 표현 금지
  editorialScore: number; // 0~100
  buy: AffiliateTarget[]; // 최소 1, 최대 4. 파트너별 1개
  addedAt: string; // YYYY-MM-DD
  sources: string[]; // 공식 브랜드 제품 페이지 1개 이상
}
export interface BeautyProductText { name: string; tagline: string; why: string; howTo: string; caution?: string }
export type BeautyText = Record<string, BeautyProductText>; // slug → 문구

// src/data/travel/types.ts
export type AreaSlug = "seongsu" | "hongdae" | "myeongdong" | "hannam-itaewon" | "apgujeong-cheongdam" | "bukchon-ikseon" | "yeouido" | "busan" | "jeju";
export type PlaceKind = "filming" | "idol" | "cafe" | "shop" | "photo" | "food" | "landmark";
export interface Place {
  slug: string; area: AreaSlug; kind: PlaceKind;
  lat: number; lng: number; mapUrl: string; // 구글 지도 검색 링크 (API 없음)
  station?: { name: string; line: string; walkMin: number }; // name 은 영문 역명
  related?: { dramas?: string[]; entityIds?: string[] }; // 드라마 slug · 위키데이터 Q-id
  hours?: string; addedAt: string; sources: string[];
}
export interface PlaceText { name: string; summary: string; address: string; tips: string[] } // tips 2~3개
export interface AreaText { name: string; tagline: string; intro: string }
export type TravelText = { areas: Record<AreaSlug, AreaText>; places: Record<string, PlaceText>; prep: { title: string; items: Record<"esim" | "tmoney" | "airport" | "stay" | "tour", { label: string; sub: string }> } };

// src/data/clinic/types.ts
export type ClinicField = "derma" | "dental" | "plastic";
export interface Procedure {
  slug: string; field: ClinicField;
  price?: { lowKrw: number; highKrw: number; unit: "session" | "tooth" | "area" | "procedure"; asOf: string; source: string }; // 공개 통계 출처가 있을 때만
  downtimeDays: [number, number]; sessions?: string; painLevel: 1 | 2 | 3; durationMin?: [number, number];
  surgical: boolean; addedAt: string; sources: string[]; // 학회·식약처·공공기관·논문 1개 이상
}
export interface ProcedureText {
  name: string; aka: string[]; what: string; whoFor: string; steps?: string; recovery: string;
  risks: string[]; questionsToAsk: string[]; aftercare: string[]; faq: { q: string; a: string }[]; // faq 3~4
}
export type ClinicText = { fields: Record<ClinicField, { name: string; intro: string }>; procedures: Record<string, ProcedureText> };

// src/data/drama/types.ts
export type WatchPlatform = "netflix" | "viki" | "disney" | "prime" | "viu" | "iqiyi" | "wavve" | "tving";
export interface Drama {
  slug: string; year: number; episodes: number; network: string; genres: string[];
  wikidataId?: string; // Q-id → Entity 가 있으면 /idol 연결·sameAs
  watch: { platform: WatchPlatform; url?: string; regions?: Region[] }[];
  cast: { name: string; entityId?: string; role?: string }[]; // name 영문
  filmingPlaces: string[]; similar: string[]; // place slug · drama slug
  editorialScore: number; addedAt: string; sources: string[];
}
export interface DramaText { title: string; tagline: string; synopsis: string; whyWatch: string[] } // whyWatch 3개
export type DramaText9 = Record<string, DramaText>;
```

로더 공개 함수(P0b, `src/data/<section>/index.ts`): `list<Section>(locale): Promise<(Item & { text })[]>`, `get<Section>(slug, locale)`, `<section>Slugs(): string[]`, `<section>Summary(slug, locale): Promise<CatalogSummary|null>`, `<section>Featured(locale, n): Promise<CatalogSummary[]>`(editorialScore 상위). 공용 `src/data/catalog.ts`: `summarize(kind, id, locale)`, `featured(section, locale, n)`, `isKnownItem(kind, id): boolean`. `article` kind는 `lib/articles.ts`의 slug 조회를 쓴다. 데이터 파일 크기 목표: 섹션당 언어 파일 ≤ 120KB.

### 3-2. DB — `ItemVote` 하나

```prisma
// 로그인 없는 항목 평가·관심 투표·별점 (뷰티 제품·시술·드라마 공용). 한 기기(voterHash)가 항목마다 한 번, 바꾸면 덮어쓴다.
// itemId 는 정적 카탈로그 slug 라 외래 키가 없다. IP 는 저장하지 않는다
model ItemVote {
  kind      String // "beauty" | "clinic" | "drama"
  itemId    String // 카탈로그 slug
  choice    String // beauty: love|ok|meh · clinic: curious|done|pass · drama: 1|2|3|4|5
  facet     String? // beauty 만: 피부 타입 dry|oily|combination|sensitive|normal
  voterHash String
  ipHash    String
  locale    String
  country   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@id([kind, itemId, voterHash])
  @@index([kind, itemId, choice])
  @@index([ipHash, createdAt])
}
```

마이그레이션: `npm run db:migrate:new -- item_vote` → `packages/db/prisma/migrations/<UTC>_item_vote/migration.sql` → `npm run db:migrate` → `npm run db:generate`. `src/lib/voter.ts:27` `VoteTable`에 `"item"` 추가, `rateLimited`에 `prisma.itemVote.count` 분기.

운영 반영 주의: 마이그레이션은 Vercel 빌드가 아니라 `.github/workflows/pipeline.yml:53`의 `db:migrate`가 적용한다. 머지 후 workflow_dispatch로 한 번 돌린다.

### 3-3. API 계약 (P0a, `cheer` 라우트 패턴)

`POST /api/items/[kind]/[itemId]/vote` body `{ choice: string; facet?: string; locale: string }`
- 200 `{ counted: true, changed: boolean, totals: Record<string, number>, byFacet: Record<string, Record<string, number>>, total: number }` (같은 choice 재전송이면 `counted:false`, 200)
- 400 `{error:"invalid"}` (kind ∉ `beauty|clinic|drama`, itemId 형식, choice ∉ `CHOICES[kind]`, facet ∉ `FACETS[kind]`) · 403 `bot`(`isBot`) · 404 `notFound`(`isKnownItem` — 통합 때 P7이 연결, 그 전엔 형식만) · 429 `tooFast`(ipHash 시간당 30) · 503 `unavailable`(테이블 없음·DB 불통)
- voterHash scope `item:${kind}:${itemId}`. upsert로 choice·facet 덮어쓰기. `cache-control: no-store`.

`GET /api/items/[kind]/[itemId]` → 200 위 집계, `cache-control: public, s-maxage=300, stale-while-revalidate=600`.

서버 집계 `src/lib/item-votes.ts`: `getItemTotals(kind, itemIds: string[]): Promise<Map<string, ItemTotals>>`(groupBy 1회, `react cache()`), `castItemVote(kind, itemId, input, headers)`. 둘 다 Prisma 오류 `P2021`(테이블 없음)·`P1001`(연결 불가)을 잡아 빈 집계/503으로 돌린다 → **미리보기 배포·테이블 없는 환경에서 페이지가 죽지 않는다.** 페이지는 서버 렌더 숫자를 HTML에 넣고(SEO) 클라이언트는 투표 응답으로 덮어쓴다.

어워드 점수(공개, 제휴 무관): `score = editorialScore + 25 × (love − meh) / (love + ok + meh + 5)`. 동점이면 `addedAt` 최신. 어워드 페이지 하단에 이 식을 적는다(편집 독립 약속 `Trust/pages` 72-75줄과 일치).

## 4. 공용 기반 — 먼저 만드는 것과 공개 인터페이스

### P0a 참여 기반 (소유 파일)

`src/lib/saved.ts` (클라이언트 전용, `storageGet/Set` + 메모리 폴백)
```ts
export type SavedKind = "article" | "beauty" | "place" | "clinic" | "drama";
export interface SavedItem { kind: SavedKind; id: string; at: number }
export const SAVED_KEY = "hb:saved"; export const SAVED_MAX = 300; export const SAVED_CHANGED = "hb:saved-changed";
export function readSaved(): SavedItem[];                       // 최신순
export function isSaved(kind: SavedKind, id: string): boolean;
export function toggleSaved(kind: SavedKind, id: string): boolean; // 저장됐으면 true
export function removeSaved(kind: SavedKind, id: string): void;
export function addSavedMany(items: SavedItem[]): number;        // 공유 링크 가져오기 (중복 제외, 추가 수)
export function useSaved(): SavedItem[];                        // useSyncExternalStore(storage + SAVED_CHANGED)
export function useIsSaved(kind: SavedKind, id: string): boolean;
export function encodeSavedShare(items: SavedItem[]): string;   // "kind:id,kind:id" → base64url, 최대 100
export function decodeSavedShare(code: string): SavedItem[];
export const VISITED_KEY = "hb:visited";                        // 명소 도장
export function useVisited(): string[]; export function isVisited(slug: string): boolean; export function toggleVisited(slug: string): boolean;
```

`src/components/SaveButton.tsx` (`"use client"`)
```tsx
export function SaveButton(props: {
  kind: SavedKind; id: string; title: string;       // title: 토스트 문구
  variant?: "icon" | "chip";                        // icon = IconButton 44px(헤더·카드 모서리, HeartIcon/HeartFilledIcon) · chip = Button size "m" variant "weak"
  tone?: "ink" | "inverse"; className?: string;
}): JSX.Element
```
동작: 토글, 처음 저장 때만 `toast(t("savedToast"), { href: "/saved", actionLabel })`, `track("save"|"unsave", { kind, id })`. `HeartFilledIcon`을 `src/components/icons.tsx`에 추가(`rankings/icons.tsx`의 `HEART` path 재사용).

`src/components/ItemVote.tsx` (`"use client"`)
```tsx
export type VoteKind = "beauty" | "clinic" | "drama";
export interface ItemTotals { totals: Record<string, number>; byFacet: Record<string, Record<string, number>>; total: number }
export function useItemVote(kind: VoteKind, itemId: string, initial: ItemTotals): { mine: string | null; totals: ItemTotals; busy: boolean; error: string; vote(choice: string, facet?: string): Promise<void> }
export function VoteChips(props: { kind: VoteKind; itemId: string; initial: ItemTotals; choices: { key: string; label: string }[]; facet?: string; question: string; showPercent?: boolean; className?: string }): JSX.Element
export function StarVote(props: { kind: "drama"; itemId: string; initial: ItemTotals; label: string }): JSX.Element
```
localStorage `hb:vote:{kind}:{id}` = 내 choice. 선택 전엔 숫자를 숨기지 않되 0표면 "첫 번째로 평가해 보세요"(`Engage.voteFirst`). 표 수는 실제 집계만.

그 밖에 P0a 소유: `src/lib/item-votes.ts`, `src/app/api/items/[kind]/[itemId]/route.ts`, `.../vote/route.ts`, `src/app/api/saved/route.ts`(`items` 쿼리 `kind:id` 콤마 ≤100 → `summarize()` → `CatalogSummary[]`), `src/app/[locale]/saved/page.tsx` + `src/components/saved/*`, `packages/db/prisma/schema.prisma`(ItemVote만) + 마이그레이션, `src/lib/voter.ts`, `src/lib/track.ts`(§8 이벤트 전부 추가), `src/app/[locale]/privacy/page.tsx`(`STORAGE_KEYS`에 `hb:saved`·`hb:visited`·`hb:vote:{kind}:{id}`·`hb:skin-type`) + `messages/ns/Trust/pages/*.json` 9개의 `storageKeys`만, `messages/ns/Engage/*.json` 9개(키 추가: `savedTab, save, unsave, savedToast, savedOpen, savedEmpty, savedShare, savedImport, savedImported, savedTabs.{all,article,beauty,place,clinic,drama}, voteFirst, voteThanks, voteError, voteTooFast, visited, markVisited`).

### P0b 탐색·수익 기반 (소유 파일)

`src/lib/affiliate.ts` (서버 전용)
```ts
export type { AffiliatePartner, AffiliateTarget, Region } from "@/data/types";
export const PARTNER_NAME: Record<AffiliatePartner, string>; // "Olive Young Global" | "YesStyle" | "Amazon" | "Klook" | "Creatrip" | "Trip.com" | "Airalo"
export const PARTNER_ENV: Record<AffiliatePartner, string>;  // AFFILIATE_OLIVEYOUNG | AFFILIATE_YESSTYLE | AFFILIATE_AMAZON | AFFILIATE_KLOOK | AFFILIATE_CREATRIP | AFFILIATE_TRIP | AFFILIATE_AIRALO
export interface AffiliateHref { href: string; tagged: boolean; partner: AffiliatePartner }
export function affiliateHref(target: AffiliateTarget): AffiliateHref;
export function partnersForLocale(locale: string, targets: AffiliateTarget[]): AffiliateTarget[]; // 언어별 우선순위 정렬 + 지역 제외 (예: en → amazon,yesstyle 먼저; zh-TW·ja → oliveyoung 먼저; regions 에 us 만 있으면 zh 에서 제외)
```
환경변수 값 규칙(사장님이 대시보드에서 받은 그대로 붙여 넣는다): 값에 `{url}`이 있으면 `encodeURIComponent(url)`로 치환(Involve·Awin·Impact 딥링크형), 값이 `?`로 시작하면 원 URL의 쿼리에 합친다(Amazon `?tag=`, Creatrip `?utm_source=`), 비면 원 URL·`tagged:false`. 테스트 `src/lib/affiliate.test.ts` 3케이스(치환·쿼리 합치기·빈 값).

`src/components/affiliate/AffiliateBox.tsx` (서버) · `AffiliateLink.tsx` (클라이언트 `<a>`)
```tsx
export function AffiliateBox(props: {
  title: string; locale: string; placement: string;              // placement "clinic*" 이면 throw (의료 글 제휴 금지)
  items: { target: AffiliateTarget; label: string; sub?: string; itemId?: string }[];
  note?: string; compact?: boolean;
}): JSX.Element | null                                           // items 가 비면 null
export function AffiliateLink(props: { href: AffiliateHref; placement: string; itemId?: string; className?: string; children: ReactNode }): JSX.Element
```
마크업: `Badge tone="neutral"`로 `Affiliate.prLabel` → 고지 문장 `Affiliate.disclosure`(상자 첫 줄, `t.rich`로 `/disclosure` 링크) → `ListRow`(P0b가 `ListRow`·`Button` AsLink에 `rel?: string` prop 추가) `rel="sponsored nofollow noopener" target="_blank"` → 클릭 시 `track("affiliate_click", { partner, placement, item, tagged })`.

`src/components/guide/CrossRail.tsx` (서버): `CrossRail({ from: Section | "article"; locale: Locale; exclude?: string })` — `featured()`로 다른 섹션 카드 3~4개, `.rail` 가로 스크롤, 전부 비면 null. `src/components/guide/GuideRail.tsx` (홈): 섹션 4개 타일(틴트 `--tint-kbeauty`·`--tint-travel`·`--tint-clinic`(신설)·`--tint-kdrama`, 아이콘 `SparkleIcon·PlaneIcon·SunIcon·ClapperIcon`) + 제목·한 줄.

`src/lib/jsonld-catalog.ts`
```ts
export interface Crumb { name: string; url: string }
export function breadcrumbLd(crumbs: Crumb[]): object;
export function itemListLd(i: { pageUrl: string; name: string; items: { name: string; url: string; type?: string }[] }): object;
export function productLd(i: { url: string; name: string; brand: string; description: string; category?: string; rating?: { value: number; count: number } | null }): object; // rating 은 count ≥ 5 일 때만 넘긴다
export function placeLd(i: { url: string; name: string; description: string; address?: string; geo?: { lat: number; lng: number }; sameAs?: string[] }): object; // TouristAttraction
export function faqLd(faq: { q: string; a: string }[]): object;
export function tvSeriesLd(i: { url: string; name: string; alternateName?: string[]; description: string; startDate?: string; numberOfEpisodes?: number; actors?: { name: string; url?: string }[]; sameAs?: string[] }): object;
export function collectionLd(i: { pageUrl: string; name: string; description: string; locale: string; parts: { name: string; url: string }[] }): object;
export function graph(...nodes: object[]): object; // { "@context": "https://schema.org", "@graph": nodes }
```

그 밖에 P0b 소유: `src/data/types.ts`, `src/data/catalog.ts`, `src/data/{beauty,travel,clinic,drama}/{types.ts,index.ts}` + 빈 `items.ts`(`export const BEAUTY_ITEMS: BeautyProduct[] = []`) + 9개 `text/{locale}.json`(`{}`), `src/components/TabBar.tsx`(§6-0), `src/components/MenuButton.tsx`(가이드·저장 줄 2개, `ROW` 패턴), `src/components/SiteFooter.tsx`(explore에 `/guide /beauty /travel /clinic /drama`, 아래에 `/partners /disclosure`; 문구는 `messages/ns/Seo/*.json` `footer.*`), `src/app/[locale]/page.tsx`(`<UpcomingRail/>` 바로 뒤 `<GuideRail locale={locale}/>` 한 줄), `src/app/[locale]/guide/page.tsx`, `src/i18n/request.ts`(`NAMESPACES`에 `"Guide","Affiliate","Beauty","Travel","Clinic","Drama"`), `messages/ns/Guide/*.json`·`Affiliate/*.json`(내용), `Beauty/Travel/Clinic/Drama/*.json`(빈 `{}` 9개씩), `src/app/globals.css`(`--tint-clinic` 라이트·다크·`@theme inline` 3곳), `src/components/ui/ListRow.tsx`·`Button.tsx`(`rel` prop만), `apps/web/package.json`(`server-only`).

규칙: **P0가 만든 파일은 패키지가 고치지 않는다.** 헬퍼가 더 필요하면 자기 소유 파일(`src/lib/<section>.ts`)에 만든다. 예외는 §5에 적힌 "공유 파일 수정" 줄뿐이다.

## 5. 병렬 작업 패키지

수행 순서: **T0(19:45)** P0a·P0b 시작, 데이터 패키지(P2·P4)와 P5·P6의 데이터 작성, P7의 `/partners`·`/disclosure`도 T0에 시작 → **T1(20:35)** P0a·P0b를 dev에 통합(`request.ts` 한 줄 충돌은 통합자가 합집합으로 해결) → 나머지 에이전트가 `git rebase dev` 후 UI 작업 → **T2(22:40)** 전부 통합 → 22:40~23:30 검사·아이폰 캡처·리뷰. 각 에이전트는 자기 worktree, 브랜치 `feat/monetize-<패키지>`. 데이터 패키지가 P0b의 빈 `items.ts`·`text/*.json`과 add/add 충돌하면 자기 것을 택한다.

| 패키지 | 단독 소유 | 만들 것 | 네임스페이스 | 완료 기준(예/아니오) |
|---|---|---|---|---|
| **P0a** 참여 기반 | §4 P0a 목록 | 저장 lib·버튼, 평가 API·마이그레이션, `/saved`, 이벤트, 개인정보 키 | `Engage`(키 추가) | 하트 토글이 새로고침 후 유지 / `/saved`에 종류 탭·공유·가져오기 동작 / `POST vote` 200·400·403·429 / 테이블 없는 DB에서 GET이 0 집계 반환 / `npm test`·`typecheck`·`lint` 통과 |
| **P0b** 탐색·수익 기반 | §4 P0b 목록 | 탭 4개, 메뉴·푸터, 제휴 lib·상자, 카탈로그 타입·로더, `/guide`, 교차·홈 레일, JSON-LD 빌더 | `Guide`, `Affiliate`, `Seo`(푸터 키), 빈 4개 | 360px에서 탭 캡슐 ≤ 320px(ru·fr·vi·id 포함) / 제휴 환경변수 없을 때 일반 링크 + `tagged:false`, 있을 때 치환 / `rel="sponsored nofollow noopener"` 전 링크 / `placement:"clinic-x"`로 throw / 9개 언어 `/guide` 렌더 |
| **P1** 뷰티 UI | `src/app/[locale]/beauty/**`, `src/components/beauty/**`, `src/components/quiz/**`, `src/lib/beauty.ts`(어워드 점수·분류 정렬), `messages/ns/Beauty/*.json` | 허브·어워드·상세·테스트·결과(+OG) 5화면, 퀴즈 엔진 | `Beauty` | 50개 상세가 9개 언어로 빌드 / 어워드 순서가 식과 일치(테스트 1개 `lib/beauty.test.ts`) / 평가 칩이 피부 타입 facet를 보낸다 / 결과 페이지 OG 이미지 200 / 광고가 평가·구매 버튼과 한 화면 이상 떨어짐 |
| **P2** 뷰티 데이터 | `src/data/beauty/items.ts`, `src/data/beauty/text/*.json`, `src/data/beauty/skin-type.ts`(문항 6·결과 5 가중치) + `text`의 `skinType` 키 | 제품 50(분류별 cleanser5 toner5 serum8 moisturizer6 sunscreen6 mask4 lip5 base5 eye3 hair-body3), 피부 타입 테스트 문구 | — (데이터만) | 모든 제품에 공식 출처 URL / 기능성 표기 없는 제품에 미백·주름·치료 단어 0건(grep) / `buy` 최소 1·파트너별 1 / 9개 언어 파일의 slug 집합이 같다(스크립트 검사) |
| **P3** 여행 UI | `src/app/[locale]/travel/**`, `src/components/travel/**`, `src/lib/travel.ts`, `messages/ns/Travel/*.json` | 허브·동네·명소 3화면, 여행 준비 제휴 상자, 버킷리스트 진행 | `Travel` | 동네 9·명소 36 페이지 빌드 / '가 봤어요' 도장이 동네 페이지 진행률(n/4)에 반영 / 명소→드라마·인물 링크가 Entity 없으면 글자만 / 지도 링크 새 탭 |
| **P4** 여행 데이터 | `src/data/travel/items.ts`, `src/data/travel/text/*.json` | 동네 9, 명소 36(동네당 4: 촬영지·아이돌 성지·카페/네컷·쇼핑 중 섞어), 여행 준비 문구 | — | 좌표·주소가 공식/공공 출처와 일치 / 2022년 이전 자료만 있는 곳은 "영업 확인 필요" 표시 / 폐업 의심 0건 |
| **P5** 클리닉 UI+데이터 | `src/app/[locale]/clinic/**`, `src/components/clinic/**`, `src/data/clinic/items.ts`, `src/data/clinic/text/*.json`, `messages/ns/Clinic/*.json` | 허브·시술 22(derma 10: laser-toning pico-laser rejuran skin-booster potenza ulthera thermage botox filler aqua-peel / dental 6: scaling whitening resin laminate implant clear-aligner / plastic 6: double-eyelid rhinoplasty thread-lift fat-grafting canthoplasty ptosis-correction)·고르는 법 | `Clinic` | 병원명·전후 사진·후기·'추천 병원' 0건 / 모든 페이지 상단에 의료 고지 / 가격은 출처·기준일 있는 것만 / 제휴 상자·쿠팡 0건(grep `AffiliateBox` 없음) / 관심 투표 3칩 동작 / 시간 부족 시 derma 10 → dental 6 → plastic 6 순으로 줄인다 |
| **P6** 드라마·케이팝 UI+데이터 | `src/app/[locale]/drama/**`, `src/components/drama/**`, `src/lib/drama.ts`, `src/lib/kpop-chart.ts`, `src/data/drama/items.ts`, `src/data/drama/text/*.json`, `messages/ns/Drama/*.json` | 허브·가이드 24, 별점, 애플 RSS 레일 | `Drama` | 24편 빌드 / 출연→`/idol` 링크는 Entity.slug 있을 때만 / 촬영지 링크가 P4 slug와 일치(없으면 숨김) / RSS 실패 시 레일 숨김, `KPOP_CHART=off`로 끔 / 별점 5단계 저장·집계 |
| **P7** 수익·검색·연결 | `src/app/[locale]/partners/**`, `src/app/[locale]/disclosure/**`, `messages/ns/Partners/pages/*.json`, `messages/ns/Disclosure/pages/*.json`, `src/app/sitemap.ts`, `src/app/llms.txt/route.ts`, `src/app/robots.ts`, `src/lib/ads.ts`+`ads.test.ts`, `src/app/[locale]/news/[slug]/page.tsx`, `scripts/smoke.sh`, `apps/worker/src/collectors/policy.ts`, `.env.example` | 협찬 패키지 페이지(언어별 PV 공개 자리·brands@ 메일·패키지 3종), 제휴 고지 페이지, 사이트맵·llms 절, 쿠팡 호스트 `unnienote.app`, 글 페이지에 `SaveButton`(헤더 action, `ShareButton` 옆)·`CrossRail`(AdSlot 앞), 통합 후 `isKnownItem` 연결·탭 저장 수 배지 | (긴 글은 `pages` 패턴, provider 밖) | 사이트맵에 신규 경로 9개 언어 전부·`/saved` 제외 / llms.txt에 4 섹션 절 / `ads.test.ts`에 unnienote 호스트 케이스 / 글 페이지 하트 동작 / smoke 경로 추가 |

공유 파일 수정 규칙: `src/i18n/request.ts`·`TabBar`·`MenuButton`·`SiteFooter`·홈 `page.tsx`·`globals.css`·`ListRow`·`Button`은 P0b만, `track.ts`·`voter.ts`·`schema.prisma`·`privacy`는 P0a만, `sitemap`·`llms`·`robots`·`ads.ts`·글 페이지는 P7만 고친다. 다른 패키지는 이 파일들을 건드리지 않는다.

## 6. 화면 설계 (모바일, 위에서 아래)

공통: `AppHeader`(허브 `root`, 상세 `pushed` + `action={<><SaveButton variant="icon"/><ShareButton/></>}`), `px-gutter pt-6` h1 `text-st2 font-bold text-ink-900` + 소개 `text-t6 text-ink-600`, 섹션 사이 `<div aria-hidden className="mt-6 h-4 bg-band"/>`, 빈 상태 `EmptyMemo`. 이미지는 이번에 없다(권리 확보 전) → `MemoCover` 식 틴트 타이포 카드(브랜드 이니셜·분류 아이콘)로 통일한다. 새 색·새 글자 크기·그라데이션·이모지 금지, `lint-tokens --strict` 통과.

### 6-0. 탭·메뉴
`TABS`: `/`(Nav.home) · `/rankings`(Rankings.tab) · `/guide`(Guide.tab) · `/saved`(Engage.savedTab). `min-w-24` → `min-w-[4.5rem]`, 선택 판정에 `/guide|/beauty|/travel|/clinic|/drama` → guide, `/saved` → saved 추가, `t`에 `Guide`·`Engage` 추가, 17줄 주석 갱신. 라벨: Guide = Guide/ガイド/指南/指南/가이드/Cẩm nang/Panduan/Guides/Гид, Saved = Saved/保存/收藏/收藏/저장/Đã lưu/Simpan/Favoris/Моё. 메뉴 하단 `ul`에 가이드·저장 줄 추가(일정 줄 유지).

### 6-1. `/guide` 허브
h1 "가이드" + 한 줄 → 섹션 타일 4개(세로 목록, 틴트 아이콘·제목·한 줄·꺾쇠; 뷰티가 첫째) → "지금 인기"(`featured` 섞어 6개, `ListRow`) → 피부 타입 테스트 CTA 카드(`Button size="l" variant="primary"`) → AdSlot. 심리: 선택지 4개만(결정 피로 제거).

### 6-2. `/beauty`
h1 → 어워드 분류 칩 레일(`.rail`, 알약) → 분류별 1위 카드 10개(순위 번호·브랜드·이름·₩표기·'NEW'·하트·"전체 보기") → 피부 타입 테스트 CTA("내 피부 타입 알고 고르기") → `AffiliateBox`("어디서 사나", 올리브영 글로벌·YesStyle·Amazon 허브 링크, placement `beauty-hub`) → AdSlot → `CrossRail from="beauty"`. 심리: 어워드=사회적 증거, 테스트=자기 발견.

### 6-3. `/beauty/awards/[category]`
h1(분류 어워드) → 산식 한 줄 + 갱신 시각 → 순위 목록(번호 `text-st8`, 틴트 카드, 브랜드·이름·피부 타입 칩·₩·하트) → 산식 설명 각주 → AdSlot → CrossRail.

### 6-4. `/beauty/p/[slug]`
pushed 헤더(하트·공유) → 틴트 커버(브랜드 이니셜·분류) → h1 제품명·브랜드·₩·'NEW' → 한 줄 tagline → "맞는 피부 타입" 칩 + "핵심 성분" 칩 → `VoteChips`(질문 "써 봤어요?", 인생템/괜찮음/별로, facet=`hb:skin-type` 또는 인라인 선택, 결과 "건성 92%가 인생템") → why / howTo / caution → `AffiliateBox`("어디서 사나", `partnersForLocale` 정렬, placement `beauty-detail`, note 미국 배송 제한) → 같은 분류 다른 제품 3개 → AdSlot → CrossRail. 광고는 구매 상자와 최소 한 블록(관련 제품) 사이. 심리: 내 타입 집계=개인화·사회적 증거.

### 6-5. `/beauty/skin-type` · `/[type]`
테스트: h1·"재미용·의학 진단 아님" 고지 → 문항 6개를 **한 화면에서 단계 전환**(진행 점 6개, 보기 버튼 `Button size="l" variant="neutral"`, 뒤로) → 끝나면 `router.push(/beauty/skin-type/{type})`, `hb:skin-type` 저장, `track("quiz_complete")`. 광고 없음. 결과: 틴트 히어로(타입 이름·한 줄 성격) → 공유 버튼(OG 이미지는 라틴 글자만: "I'm {type} skin · Unnie Note") → "이 타입을 위한 제품" 5개(`skinTypes` 포함 + 점수순) → 피부 관리 팁 3줄 → AdSlot → CrossRail. 심리: 정체성 라벨 → 공유, 상호성(팁 먼저).

### 6-6. `/travel`
h1 → 동네 9 타일(틴트 `--tint-travel`, 이름·한 줄·명소 수·내 도장 n/4) → `AffiliateBox`("여행 준비", eSIM(Klook/Airalo)·교통카드·공항 이동·숙소(Trip.com)·투어(Klook/Creatrip), placement `travel-prep`) → AdSlot → CrossRail. 심리: 진행률(도장)=완성 욕구.

### 6-7. `/travel/[area]` · `/travel/place/[slug]`
동네: pushed 헤더 → h1·tagline·intro → 명소 4개 목록(종류 배지·역·도장·하트) → 진행 막대 "n/4 가 봤어요" → `AffiliateBox` compact(여행 준비) → AdSlot → 다른 동네 레일. 명소: 헤더(하트·공유) → 틴트 커버(종류 아이콘) → h1·동네·종류 → summary → 관련 드라마·인물 칩(링크는 데이터 있을 때만) → 가까운 역(라인·도보 분) → 주소 + "지도에서 열기"(`Button variant="neutral" external`) → 팁 목록 → `'가 봤어요'` 도장 버튼(`Button variant="weak"`, 로컬만) → AdSlot → 같은 동네 다른 명소 → CrossRail.

### 6-8. `/clinic` · `/clinic/[slug]` · `/clinic/how-to-choose`
허브: h1 → **의료 고지 카드**(`bg-band`, "의료 조언·병원 알선 아님. 병원별 정보·후기·순위를 싣지 않습니다") → 분야 3 섹션(피부·치과·성형)별 시술 목록(`ListRow`, 회복 기간·통증 단계 메타) → "안전하게 고르는 법" 링크 카드 → AdSlot. 시술: pushed 헤더(하트·공유) → h1·aka·분야 배지 → 사실 표(회복 `downtimeDays`, 통증 1~3, 소요, 횟수, 수술 여부) → what/whoFor → 가격대 카드(있을 때만: "서울 보통 ₩a~b / 단위 / 출처·기준일 / 병원·부위마다 다름") → recovery → 위험·부작용 목록(반드시) → 병원에 물어볼 질문(체크리스트, 저장하면 저장함에서 다시 봄) → aftercare → FAQ → `VoteChips`(궁금해요/해봤어요/패스, "효과 평가가 아닌 관심 집계") → 의료 고지 반복 → AdSlot → 같은 분야 다른 시술 → CrossRail(제휴 없음). 고르는 법: InfoSection 패턴 — 외국인환자 유치 등록 확인(의료해외진출법), 의사 면허 조회, 서면 견적·동의서, 통역, 분쟁 조정 창구. 금지선: 병원명·링크·전후 사진·"추천"·"1위"·효과 보장.

### 6-9. `/drama` · `/drama/[slug]`
허브: h1 → "지금 화제"(기존 `kdrama` 스냅숏 상위 + 큐레이션 점수 섞어 5개) → "한국에서 지금 듣는 노래"(애플 RSS Top 10, 출처 표기, 외부 링크) → 가이드 목록 24(장르 칩 필터, 별점 평균·수) → AdSlot → CrossRail. 상세: 헤더(하트·공유) → 틴트 커버 → h1·연도·회차·방송사·장르 → tagline → `StarVote` → "어디서 보나"(플랫폼 배지, 지역 표시, 일반 링크·제휴 아님) → synopsis → whyWatch 3 → 출연(Entity 있으면 `/idol` 링크) → 촬영지(`/travel/place`) → 비슷한 작품 → AdSlot → CrossRail from="drama"(여행·뷰티 우선).

### 6-10. `/saved`
h1 "저장함" + 개수 → 종류 칩(전체·글·뷰티·명소·시술·드라마) → 목록(`ListRow`, 틴트 썸네일, 저장 해제 ×) → 진행 메모("이번 달 n개 저장") → 공유 버튼(`?i=` 링크 복사) → 빈 상태 `EmptyMemo`("하트를 누르면 여기 모여요" + 가이드 링크) → 설치 안내 한 줄("홈 화면에 추가하면 저장한 게 유지돼요"). `?i=`로 열면 상단 배너 "목록 가져오기 n개". 광고 없음.

### 6-11. `/partners` · `/disclosure`
partners: pushed 헤더 → h1 "브랜드와 함께" → 독자(언어 9·주요 국가, 숫자는 PostHog 확인 전 비워 두고 자리만) → 패키지 3종(기사 9개 언어 + 홈 레일 1주 / 어워드 스폰서 라벨(랭킹에는 영향 없음 명시) / 여행 가이드 제휴) → 하지 않는 것(병원 광고·후기·순위 판매, 랭킹 판매) → 문의(`NEXT_PUBLIC_CONTACT_EMAIL` 또는 brands@ 자리). disclosure: 제휴 파트너 목록·수수료 원리·가격 불변·편집 독립·의료 무제휴·갱신일.

### 다크패턴 금지선
가짜 마감·재고·활동 알림 없음(실제 집계만, 0표는 0). 투표 결과는 산식 공개. 거절 버튼 중립 문구. 테스트 "재미용" 표기. 광고는 답안·투표·구매·다음 버튼 옆 금지, 문항 사이 금지. 스트릭·죄책감 문구 없음("이번 주 n개 봤어요"식 누적만). 제휴 순서는 수수료가 아니라 언어·지역 적합성·편집 점수.

## 7. 콘텐츠 정확성 규칙 (데이터를 쓰는 에이전트)

1. **출처 필수**: 항목마다 `sources`에 공식 페이지(브랜드·플랫폼·관광공사·학회·식약처·공공데이터) URL ≥1. 블로그·커뮤니티는 출처 불가. 확인 못 한 항목은 넣지 않는다(수를 줄이는 쪽).
2. **가격**: 뷰티는 ₩/₩₩/₩₩₩만(정확한 가격·할인 금지). 시술은 `price`에 출처·기준일(`asOf` YYYY-MM)이 있을 때만, 범위로, "병원·부위마다 다름" 자동 표기. 병원별 가격·이벤트 금지.
3. **효능 표현(화장품법 §13·시행규칙 별표5)**: `functional` 표기 제품만 '미백·주름 개선·자외선 차단' 허용. 그 외는 '보습·진정·결 정돈'까지. 금지어: 치료, 재생, 의사 추천, 최고, 1위, 피부과 처방. 비교는 대상·기준 명시.
4. **의료(법 §56·시행령 §23)**: 병원명·의사명·연락처·예약 링크·전후 사진·경험담·"추천·보장·안전·최고" 0건. 위험·부작용·회복 기간 반드시. 공식 출처(학회·식약처·질병청·NHS·FDA 등) 인용. 페이지마다 고지 문장. 가슴 등 친밀 부위 시술은 이번 범위 밖.
5. **제휴 고지(심사지침 2026-06)**: 상자 첫 줄에 해당 언어로 "이 링크로 구매하면 언니노트가 수수료를 받습니다. 가격은 같습니다." PR 배지 단독 사용 금지, 댓글·더보기 안 금지.
6. **여행**: 좌표·주소·역은 공식/공공 출처. 2022년 이전 자료만 있는 곳은 `hours`에 "영업 확인 필요". 폐업 의심은 제외. 촬영지는 공공데이터(문화정보원 촬영지 CSV)·방송사 공식 자료로 확인.
7. **드라마**: 플랫폼·지역은 각 플랫폼 공식 페이지로 확인(없으면 `regions` 생략). 줄거리는 스포일러 없이 1·2화 범위. 출연 Q-id는 위키데이터에서 확인.
8. **9개 언어**: en 기준으로 ja·zh-TW·ko는 현지 표현으로 다시 쓰고, zh-CN은 zh-TW를 간체로(용어 차이 반영), vi·id·fr·ru는 en 기준 번역. 브랜드·제품명·지명·플랫폼명은 원문 유지. 길이: tagline ≤ 60자, why ≤ 240자, synopsis ≤ 320자, tips 각 ≤ 90자. 모든 언어 파일의 slug 집합이 같아야 한다.
9. **AI 표기·가상 후기 금지**: 카탈로그 문구는 편집 설명이며 "써 보니" 같은 1인칭 체험담을 쓰지 않는다. `/disclosure`에 "카탈로그 설명은 공식 자료를 바탕으로 편집팀이 AI 보조로 작성" 명시.
10. **기준일**: `addedAt`과 `price.asOf`는 실제 작성일(2026-10-19). 시술 페이지 하단 "정보 기준일" 표시.

## 8. 분석 이벤트와 성공 지표

`src/lib/track.ts` `TrackEvent`에 추가(P0a): `save`, `unsave`, `saved_view`, `saved_share`, `saved_import`, `affiliate_click`, `item_vote`, `quiz_start`, `quiz_complete`, `quiz_share`, `guide_tile_open`, `cross_rail_click`, `visited_stamp`, `buy_box_view`. params(평면): `kind`, `id`, `partner`, `placement`, `item`, `tagged`, `choice`, `facet`, `quiz`, `result`, `from`, `to`, `count`.

| 지표 | 정의 | 2주 목표(추정) |
|---|---|---|
| 제휴 클릭률 | `affiliate_click` / 제휴 상자가 있는 페이지뷰 | ≥ 3% |
| 세션당 PV | PostHog 세션 | 1.6 → 2.2 |
| 저장률 | `save` 세션 / 전체 세션 | ≥ 8% |
| 저장함 재방문 | `saved_view` 7일 재방문 | ≥ 25% |
| 테스트 완료·공유 | `quiz_complete`/`quiz_start`, `quiz_share`/`quiz_complete` | 70% · 10% |
| 가이드 섹션 PV 비중 | `/beauty|/travel|/clinic|/drama` PV / 전체 | ≥ 30% |
| 광고 RPM | 애드센스 보고서(승인 후) | 가이드 섹션이 연예 글의 2배 |

## 9. 사장님이 직접 할 일

| 일 | 어디에 | 비고 |
|---|---|---|
| 올리브영 글로벌 Affiliate 가입 → 링크 형식 확인 | Vercel env `AFFILIATE_OLIVEYOUNG` | 사이트 요건 없음, 미국 배송 제외 |
| Involve Asia 가입 → Klook·올리브영 CPS 신청 | `AFFILIATE_KLOOK`(딥링크 템플릿 `{url}`) | 승인 약 2일 |
| Creatrip 제휴 신청 | `AFFILIATE_CREATRIP`(`?utm_source=코드`) | 시술 상품 링크는 넣지 않는다 |
| Awin 가입 → YesStyle·iHerb·Booking | `AFFILIATE_YESSTYLE`(cread 템플릿) | 보증금 첫 정산 때 환급 |
| Amazon Associates(미국) | `AFFILIATE_AMAZON`(`?tag=xxx-20`) | 180일 내 3건 판매 조건 확인 |
| Airalo(Impact), Trip.com | `AFFILIATE_AIRALO`, `AFFILIATE_TRIP` | 보조 |
| 쿠팡 파트너스 '미디어 관리'에 `unnienote.app` 등록 | 코드는 P7이 고침 | 등록 전엔 배너 안 뜸 |
| Vercel Pro 전환 → 애드센스 신청 → 슬롯 2개 발급 | `NEXT_PUBLIC_ADSENSE_CLIENT`, `_SLOT_ARTICLE`, `_SLOT_GUIDE` | 의료 페이지 수익의 유일한 길 |
| brands@ 메일(또는 기존 문의 메일) 결정 | `NEXT_PUBLIC_CONTACT_EMAIL` | `/partners`·`/contact` 색인 조건 |
| 머지 뒤 파이프라인 workflow_dispatch 1회 | GitHub Actions | `ItemVote` 마이그레이션 적용 |
| 공공데이터포털 키(TourAPI·심평원·식약처) | 다음 단계(사진·병원 사실 목록·성분 사전) | 이번엔 불필요 |
| 넷플릭스 Top10 TSV 주 1회 수동 다운로드 | 다음 단계 | 이번 범위 밖 |
| 클리닉 섹션 변호사 검토, 'Unni'(강남언니) 상표 혼동 확인 | — | 출시 후 2주 안 |

## 10. 통합·검사 절차 (22:40~)

1. 순서대로 dev에 머지: P0a → P0b → P2 → P4 → P1 → P3 → P5 → P6 → P7. 충돌 규칙 §5.
2. `npm run db:start && npm run db:migrate && npm run db:generate` → `npm run typecheck` → `npm run lint`(토큰 strict 포함) → `npm test` → `npm run build`.
3. 데이터 검사 스크립트(P7이 `apps/web/scripts/check-catalog.mjs`로 추가): 9개 언어 slug 집합 일치, 금지어 grep(§7-3·4), `sources` 비어 있는 항목 0, `buy`·`clinic` 교차 0.
4. `sh scripts/smoke.sh` + `node scripts/screens.mjs`로 아이폰 폭 캡처: 홈·가이드·뷰티 상세·테스트 결과·동네·시술·드라마·저장함 8장. 탭 캡슐 폭, 광고 자리 예약 높이, 하트 토글 확인.
5. 코드 리뷰(정확성·법 규칙·토큰) 후 결과 보고.

## 부록 A. 언어별 문구 파일 모양 확정 (19:05, 통합자)

§3-1 의 `*Text` 타입은 **파일 한 개의 최상위 모양**이 아래와 같다. 데이터·번역·로더(P0b)·화면 에이전트 모두 이 모양을 따른다. 9개 언어 파일은 키 집합이 같아야 한다.

```ts
// src/data/beauty/types.ts 에 추가
export interface SkinQuizOption { id: string; weights: Partial<Record<SkinType, number>> }
export interface SkinQuizQuestion { id: string; options: SkinQuizOption[] }        // src/data/beauty/skin-type.ts: export const SKIN_QUIZ: SkinQuizQuestion[] (문항 6)
export interface SkinTypeText {
  title: string; intro: string; disclaimer: string;
  questions: Record<string, { q: string; options: Record<string, string> }>;     // 문항 id → 질문, 보기 id → 보기 문구
  results: Record<SkinType, { name: string; oneLiner: string; tips: string[] }>;  // tips 3개
}
export interface BeautyTextFile {
  categories: Record<BeautyCategory, { name: string; intro: string }>;
  products: Record<string, BeautyProductText>;                                    // slug → 문구
  skinType: SkinTypeText;
}

// src/data/travel/types.ts — TravelText 그대로 (areas · places · prep)

// src/data/clinic/types.ts — ClinicText 그대로 (fields · procedures)

// src/data/drama/types.ts 에 추가
export interface DramaTextFile {
  genres: Record<string, string>;            // Drama.genres 에 쓰는 영문 소문자 키(romance, fantasy, thriller, comedy, melodrama, legal, medical, historical, youth, family, action, mystery) → 번역
  dramas: Record<string, DramaText>;         // slug → 문구
}
```

정적 카탈로그 작성 흐름: 데이터 에이전트가 `.local/catalog/<section>/{items.ts,text/en.json}` 에 먼저 쓰고(작업 중 타입 확인용으로 같은 폴더에 `types.ts` 사본을 둔다), 번역 에이전트가 같은 폴더에 `text/{locale}.json` 을 쓴다. 통합자가 기반(P0b) 병합 뒤 `src/data/<section>/` 로 옮긴다. `items.ts` 의 import 는 `from "./types"`, 공용 타입은 `from "../types"` 로 쓴다.
