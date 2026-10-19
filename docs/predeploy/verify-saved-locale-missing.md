# 검증 — 언어를 바꾸면 저장한 글이 '불러오지 못함' 줄로 남는다는 보고

- 보고: "en 에서 글 저장 → /ru/saved 에서 1행이 'Не удалось загрузить'", 심각도 낮음, 대상 vi·id·fr·ru·ko
- 판정: **운영 결함 아님 (real=false)**. 로컬에서는 재현되지만 원인이 로컬 DB(배치 번역을 돌리지 않음)다. 운영은 vi·id·fr·ru 번역이 거의 모든 글에 있고, 빠지는 것은 갓 나온 글이 배치를 기다리는 1~2시간뿐이다. ko 는 처음부터 빠지지 않는다.
- 코드는 고치지 않았다. 점검 시각 2026-10-20 00:1x KST, 서버 `http://localhost:3400`(next start, 로컬 DB)

## 1. 로컬 재현 (iPhone 13 에뮬레이션, Playwright)

글 `ha-jung-woo-solbi-marriage-announcements-a-day-47c436` 을 `/en/news/…` 에서 하트로 저장한 뒤 언어별 `/saved` 를 열었다.

| 언어 | `/api/saved` 응답 | 저장함 첫 줄 | 링크 | 캡처 |
|---|---|---|---|---|
| en | 200, 1건 | 제목 · Articles · Celebs | `/en/news/…` | `docs/predeploy/shots/saved-en.png` |
| ko | 200, 1건 | 하정우와 솔비, 하루 차이로… · 글 · 연예 | `/ko/news/…` | `shots/saved-ko.png` |
| ru | 200, `{"items":[]}` | Не удалось загрузить · Статьи (× 로 지울 수 있음) | 없음 | `shots/saved-ru.png` |
| vi | 200, `{"items":[]}` | Không tải được mục này · Bài viết | 없음 | `shots/saved-vi.png` |

같은 내용을 API 로만 봐도 같다: `curl "http://localhost:3400/api/saved?items=article:<slug>&locale=ru"` → `{"items":[]}`, `en/ja/zh-TW/zh-CN/ko` → 제목이 온다. 로컬 DB 에는 vi·id·fr·ru 번역이 한 건도 없다.

**보고 내용 중 맞지 않는 부분**

| 보고 문장 | 실제 |
|---|---|
| "ko 15" — ko 독자도 깨진다 | 로컬 사이트맵의 ko 15 는 **색인 대상(indexable)만** 센 수다(`apps/web/src/app/sitemap.ts:130`). ko 번역은 글을 쓸 때 함께 만든다(`apps/worker/src/pipeline/write.ts:155`). 위 표처럼 ko 저장함은 정상 |
| "ru 0 (사이트맵)" → ru 번역이 없다 | 사이트맵은 noindex 번역을 넣지 않는다. 사이트맵 수로 번역 유무를 판단할 수 없다 |

## 2. 운영에서 번역이 빠지는 경우

| 근거 | 내용 |
|---|---|
| `packages/core/src/locales.ts:32-34` | en·ja·zh-TW·zh-CN·ko 는 글을 쓸 때 한 번에 만들고, vi·id·fr·ru(`BATCH_LOCALES`)는 영어판을 배치 번역으로 채운다 |
| `apps/worker/src/pipeline/translate.ts:72-77,114-116` | 발행 글 중 이 4개 언어 번역이 없는 글을 찾아 배치로 보낸다. 같은 요청은 일주일에 3번까지 |
| `.github/workflows/pipeline.yml:92` | 매 실행(약 1시간 주기)마다 `npm run worker -- translate` 로 지난 배치를 받고 새 배치를 보낸다 |
| `apps/web/src/app/[locale]/news/[slug]/page.tsx:124-129` | 글 페이지는 "이 언어 번역이 아직 없으면(배치 번역 대기 등)" 있는 언어로 보낸다 — 번역이 빠지는 것은 잠깐이라는 설계 |

**운영 실측** (읽기 전용 GET, 운영 DB 는 19:23 KST 부터 꺼져 캐시된 응답)

| 측정 | 결과 |
|---|---|
| `curl https://unnienote.app/sitemap.xml` 언어별 글 수(색인 대상만) | en 303 · ja 303 · zh-tw 303 · ko 72 · zh-cn 72 · vi 71 · id 71 · fr 71 · ru 71 — 운영에는 ru 번역이 있다 |
| `/en/feed.xml` 최신 50개 vs `/ru/feed.xml` 최신 50개 | **49개 겹침**. ru 에 없는 1개는 가장 최근 글(`korea-consumer-agency-autumn-art-salon-chungbuk-2bf47a`, 19 Oct 08:40 GMT 발행, 배치 대기 중에 DB 가 꺼짐) |
| 사이트맵에 ru 가 없는 영어 글 8개의 `/ru/news/<slug>` | 1개는 200 + `noindex`(번역은 있고 색인만 뺌). 7개는 500 — DB 가 꺼져 캐시 없는 페이지를 못 그림(번역 유무와 무관) |

즉 운영에서 보고된 화면이 나오는 조건은 셋이 겹칠 때뿐이다.

| 조건 | 빈도 |
|---|---|
| ① 발행 뒤 1~2시간 안의 글을 저장 | 새 글만 해당 |
| ② 그 사이 vi·id·fr·ru 로 언어를 바꿔 저장함을 엶 | 드묾 — 주 타깃(대만·일본·중국·영어권)은 즉시 번역 언어 |
| ③ 배치가 3번 연속 실패(영구 누락) | 드묾 — 생기면 글 페이지도 영어로 보내지는 별도 문제 |

①·② 의 경우도 저절로 낫는다. 배치가 끝나면 다음 방문 때 `useSummaries` 가 다시 묻고(`apps/web/src/components/saved/summaries.ts:49-68`, API 캐시 `s-maxage=300`) 제목이 채워진다. 저장 목록(localStorage `hb:saved`)은 지워지지 않고, 원래 언어로 돌아가면 그대로 보이며, 줄은 × 로 지울 수 있다(`SavedRow.tsx:46-47,54`).

## 3. 설계 문서 확인

`docs/monetize/{PLAN,DESIGN,BM-VALIDATION,RESULT,REVIEW-LEFT}.md` 에 "번역 없는 글을 저장함에서 어떻게 보일지" 정한 결정은 없다. 비슷한 항목은 REVIEW-LEFT.md:9(공유 링크로 받은 모르는 항목이 '불러오지 못함'으로 남음, 낮음·남음)뿐이다. 설계상 의도라고 볼 근거도, 배포를 막을 근거도 없다.

## 4. 결론

| 항목 | 판단 |
|---|---|
| 로컬 재현 | 됨 (ru·vi). ko 는 안 됨 |
| 운영 재현 조건 | 배치 번역 대기 1~2시간 + 언어 전환. 대부분 저절로 나음 |
| 배포 영향 | 없음. 내일 배포 막을 이유 아님 |
| 별도 주의 | 지금은 운영 DB 가 꺼져 `/api/saved` 자체가 실패할 수 있다. 그때는 언어와 상관없이 모든 글 줄이 '불러오지 못함'이 된다 — DB 장애 문제이지 이 보고의 문제가 아니다 |
| 나중에 할 수 있는 개선(선택) | `articleSummaries`(`apps/web/src/data/catalog.ts:63-87`)에서 그 언어 번역이 없으면 en 제목으로 채운다. 링크는 `/news/<slug>` 그대로 둬도 글 페이지가 있는 언어로 보낸다(page.tsx:124-129). 30분 규모, 우선순위 낮음 |
