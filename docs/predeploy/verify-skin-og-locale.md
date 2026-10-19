# 검증 — 피부 타입 공유 이미지가 모든 언어에서 영어 한 장

- 대상 보고: "45장 중 언어별 해시 같음(en=ja=ko=ru), alt 'My skin type · Unnie Note'. ja·zh-TW 는 결과를 LINE 으로 먼저 보냄"
- 결론: **현상은 재현됨. 다만 문서에 적힌 설계 결정이라 버그가 아니다(real=false).** 운영 배포를 막을 이유 없음.
- 측정: 2026-10-20, `http://localhost:3400`(dev 최신 빌드), 코드 수정 없음

## 1. 재현

| 확인 | 명령·주소 | 결과 |
|---|---|---|
| 5타입 × 9언어 이미지 해시 | `curl -s http://localhost:3400/{l}/beauty/skin-type/{t}/opengraph-image \| shasum` | 타입마다 언어 9개가 같은 해시(예: dry 전부 `02505eeb52`). zh-TW·zh-CN 은 307 → `/zh-tw/…`·`/zh-cn/…` 로 가고, 따라가면 같은 해시 |
| 이미지 내용 | `/zh-tw/beauty/skin-type/dry/opengraph-image` | "Unnie. NOTE / My skin type: / DRY · Unnie Note / unnienote.app" — 라틴 글자만 |
| og:image:alt | 결과 페이지 HTML | 9개 언어 모두 `My skin type · Unnie Note` |

현상 자체는 보고대로 맞다.

## 2. 설계 결정인 근거

| 문서·코드 | 내용 |
|---|---|
| `docs/monetize/PLAN.md:308` | "공유 버튼(OG 이미지는 **라틴 글자만**: "I'm {type} skin · Unnie Note")" |
| `docs/monetize/BM-VALIDATION.md:131` | 결과 이름·공유 문장은 언어별로 쓰고 ja·zh-TW 는 LINE 먼저. 그와 함께 "**OG 문구는 'My skin type: DRY · Unnie Note'로 고치고**" — 현지화와 LINE 우선을 정한 같은 줄에서 이미지는 영어 한 장으로 남기기로 함 |
| `apps/web/src/app/[locale]/beauty/skin-type/[type]/opengraph-image.tsx:9` | "라틴 글자만 쓴다 (한중일 폰트를 싣지 않는다)" — 의도를 주석으로 남김 |

보고서가 "결정 필요"로 분류한 바로 그 결정이 이미 내려져 있다.

## 3. LINE 미리보기에서 실제로 현지화되는 부분

LINE 이 링크 미리보기에 보여 주는 글자는 og:title·og:description 이고, 함께 가는 메시지 본문은 공유 문장이다. 둘 다 이미 현지화돼 있다.

| 언어 | og:title (결과 페이지 HTML) | 공유 문장 (`messages/ns/Beauty/{l}.json:114`) |
|---|---|---|
| ja | 乾燥肌さんの結果と、合う韓国コスメ | わたしは{name}でした！あなたは？6問の肌タイプチェック |
| zh-TW | 我是乾肌｜膚質測驗結果與韓國美妝推薦 | 我是{name}！你呢？6題測出你的膚質 |
| zh-CN | 我是干皮｜肤质测试结果与韩国美妆推荐 | — |
| ko | 건성 피부 결과와 맞는 K-뷰티 추천 | — |

공유 버튼: `apps/web/src/app/[locale]/beauty/skin-type/[type]/page.tsx:126-133`(`QuizShare`, `text={t("result.shareText", { name })}`).
미리보기에 영어로 남는 건 이미지 속 "My skin type: DRY" 두 단어뿐이고, alt 는 LINE·IG 미리보기에 보이지 않는다.

## 4. 판정

| 기준 | 판단 |
|---|---|
| 재현 | 됨 |
| 설계 의도인가 | 예 — PLAN §308, BM-VALIDATION §6 P1-4, 파일 주석 |
| 운영 영향 | 없음. 이미지는 200 으로 나가고 제목·설명·공유 문장은 현지화됨 |
| real | **false** |

## 5. 참고 (이 보고와 별개, 수정 아님)

- 로컬 HTML 의 og:image 주소가 `http://localhost:3000/…` 인 건 `apps/web/src/lib/url.ts:5` 의 `SITE_URL` 기본값 때문이다. 운영은 `SITE_URL` 을 쓰므로 로컬 환경 문제.
- og:image 주소가 `/zh-TW/…` 대문자라 한 번 307 을 거친다. LINE·페이스북 수집기는 리다이렉트를 따라가므로 지금은 문제 없음.
- 나중에 현지화 이미지를 정말 시험해 보려면, 결과 이름 5개(언어당)의 글자만 서브셋한 폰트를 `ImageResponse` 에 넣는 방식이 가장 싸다. 페이지는 `generateStaticParams`·`revalidate = 3600`(page.tsx:27-33)이라 만드는 비용은 빌드·재생성 때만 든다. 다만 공유 유입 지표(PostHog `quiz_complete`·공유 클릭)가 쌓인 뒤 판단할 일이다.
