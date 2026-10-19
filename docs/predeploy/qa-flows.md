# 배포 전 QA — 새 기능 흐름 (2026-10-19 23:30 ~ 10-20 00:30)

대상: `http://localhost:3400` (커밋 `1bb6006`, 23:11 빌드, 로컬 DB). 코드는 고치지 않았다. 근거 캡처·원자료: `~/Desktop/unnienote-preview/qa-flows/` (shots·out·scripts).

## 결론

| 항목 | 결과 |
|---|---|
| 새 경로 166개 × 9개 언어 HTTP | 1,494개 전부 200, 제목 누락 0, 키 이름·`{count}` 노출 0 |
| 브라우저 화면 전수 (166 × en·ja·zh-TW·ko·ru × chromium·webkit × iPhone 15·SE·1280) | 4,980쪽 + 저장·도장·투표 상태를 심은 996쪽: 콘솔 오류 0, 하이드레이션 경고 0, 4xx/5xx 0, 가로 넘침 0, 키 노출 0, 깨진 이미지 0 |
| 사용자 흐름 11개 (105개 확인 × 6조합) | 5조합 90통과·0실패, webkit 데스크톱 88통과 (실패 2는 시험 도구 한계, 아래) |
| 글자 대비 (라이트·다크, iPhone 15·SE) | 약 1.9만 글자 요소 중 기준 미달 0 |
| 제휴 링크 | 2,239개: rel·새 탭·고지 링크 전부 정상, 클리닉 화면 0개, 아마존은 en만 |
| **배포를 막을 새 결함** | **없음** (운영 DB 한도 초과는 이미 알려진 차단 요인) |

고칠 것은 2건이 '중간'이다: ① DB가 꺼지면 저장함에 글이 하나만 있어도 같은 묶음의 행이 전부 '불러오지 못함'(지금 운영 DB 상태 그대로), ② 아이폰(WebKit)에서 여는 괄호가 줄 끝에 남음(zh-TW 138쪽, ja 41쪽). 나머지는 '낮음'이다.

## 테스트 계획

| ID | 대상 | 방법 | 통과 기준 |
|---|---|---|---|
| S1 | 새 경로 전부 × 9개 언어 | `fetch` 서버 HTML (`http-sweep.mjs`) | 200, `<title>`·og:image 있음, 키·ICU 노출 없음 |
| S2 | 166 × 5개 언어 × 2 브라우저 × 3 기기 | Playwright 로드 후 DOM 검사 (`sweep.mjs`) | 콘솔 error/warning·pageerror·하이드레이션·4xx/5xx 0, `scrollWidth`≤뷰포트, 잘린 글자(의도 안 한 overflow)·키 노출·깨진 이미지 0, 하단 탭 선택이 맞음 |
| S3 | S2를 저장 80·도장 20·투표 25·피부 타입이 있는 기기로 | `SEED=1` | S2와 같음 |
| F1 | 저장/해제·저장함 종류 칩·삭제 되돌리기 | 5종류(글·뷰티·명소·시술·드라마) 저장 → /saved | 토스트 문구, `hb:saved`, 칩 개수, 탭 배지 이름 |
| F2 | 공유 링크 복사 → 다른 기기 가져오기 | 새 컨텍스트에서 `?i=` 열기 | 배너 개수, 순서 유지, `?i=` 제거, 재방문 시 배너 없음, 깨진 코드 무해 |
| F3 | LINE 보내기 (ja·zh-TW) | `window.open` 기록 | `line.me/R/share`, 문구+`/{언어}/saved?i=` |
| F4 | 300개 상한 | 실제 243개 + 형식만 맞는 글 57개 주입 | 300행 렌더 시간, 301번째 저장 시 가장 오래된 것 제거, 배지 99+ |
| F5 | 뷰티 투표 + 피부 타입 시트 | 클릭·키보드 Enter·Esc | 시트 열림·초점 가둠·Esc 복귀, facet 동봉 재전송, 새로고침 뒤 일치 |
| F6 | 피부 타입 테스트 (키보드만) | Tab/Enter/Space 6문항 → 결과 → 공유 → OG | 문항마다 초점이 질문으로, 결과 저장, en 공유 시트·ja LINE, OG 200 PNG |
| F7 | 도장·동네 진행률·4/4 | 동네→명소→도장→뒤로 ×4 | 0→4, 완료 문구, /travel 카드 4/4, 해제 시 3 |
| F8 | 드라마 별점 | 별 4 → 새로고침 → 별 5 | 눌림 유지, '평가 없음'과 어긋나지 않음, 덮어쓰기 |
| F9 | 시술 관심 투표·한국어로 보여 주기 | Space 토글 | `role=switch`, `lang=ko` 줄, ko 화면은 토글 없음 |
| F10 | 제휴 링크 | 서버 HTML 전수 (`affiliate.mjs`) | `rel="sponsored nofollow noopener"`, `target=_blank`, 새 탭 안내, `/disclosure` 링크 |
| F11 | 언어 바꾸기 | 시트 → 日本語, 뒤로 | 같은 화면·`lang=ja`, 뒤로 가면 이전 화면 |
| F12 | 다크 모드·대비 | 17개 화면 × en·ja·ru 캡처 (`visual.mjs`) | WCAG 4.5:1(큰 글 3:1) 미달 0, 탭바가 마지막 내용 안 가림 |
| F13 | 뒤로 가기·하단 탭 | 홈→가이드→뷰티→제품→뒤로×3, 바로 연 상세의 상단 뒤로 | 가이드 하위 화면은 가이드 탭, 부모로 이동 |
| X | DB 장애·도배 제한·앱 안 브라우저 | 빌드 복제본을 끊긴 DB로 3401에 띄움(검사 뒤 삭제), 같은 IP 31표, LINE·Instagram UA | 화면이 무너지지 않음 |

## 흐름 결과 (iPhone 15 기준, 6조합 공통)

| 흐름 | 결과 | 확인한 값 |
|---|---|---|
| F1 | 통과 | 첫 저장 토스트 'Saved on this browser only… / Copy link', 두 번째 'Saved “Queen of Tears” / View', 칩 `All 5·Articles 1·Beauty 1·Places 1·Clinic 1·Dramas 1`, 탭 이름 'Saved, 5 items', 되돌리기 시 원래 자리 |
| F2 | 통과 | 4개 가져옴·순서 같음·주소에서 `?i=` 지움. 없는 항목이 섞인 링크는 '3 picks'로 세고 2행이 '불러오지 못함'(REVIEW-LEFT의 남은 항목 그대로) |
| F3 | 통과 | ja 'LINEで送る', zh-TW 'LINE 傳送' → `line.me/R/share?text=…%2Fja%2Fsaved%3Fi%3D…`, `noopener` |
| F4 | 통과 | 300행 그리기 0.6~0.7초(요약 API 3번), 배지 '99+', 301번째 저장 시 가장 오래된 것이 **안내 없이** 빠짐, 보내기 링크에는 **100개만**(주소 4,205자) |
| F5 | 통과 | 시트 열림·Tab 9번 동안 초점 갇힘·Esc 뒤 'Holy grail'로 초점 복귀, `{"choice":"love","facet":"dry"}` 재전송, 'Dry skin: 1 vote so far' 즉시 반영 |
| F6 | 통과 | 6문항 모두 질문 제목으로 초점 이동, ja 결과 공유 → LINE, OG `/{언어}/beauty/skin-type/{타입}/opengraph-image` 200 PNG(45장 평균 49ms) |
| F7 | 통과 | 0/4→4/4, 'You’ve stamped every spot in Seongsu!', /travel 카드 'My stamps 4/4', 해제 뒤 3 |
| F8 | 통과 | 별 4 → 새로고침해도 '6 ratings · Your rating: 4', 별 5로 바꾸면 `changed:true`, 총수 그대로 |
| F9 | 통과 | 0표 문구 'Be the first to answer', 토글 Space로 켜짐·한국어 6줄, ko 화면 토글 없음 |
| F11 | 통과 | `/en/beauty/p/…` → `/ja/beauty/p/…`, 뒤로 → `/en/guide`. 단, ru 저장함에서 en 글 1개가 '불러오지 못함'(발견 3) |
| F13 | 통과 | 가이드 하위 전부 가이드 탭, 바로 연 제품 → `/beauty/awards/serum`, 명소 → `/travel/seongsu`. /partners·/disclosure 는 홈 탭이 켜짐(발견 10) |
| X | 아래 발견 1·4 | 앱 안 브라우저(LINE·Instagram UA)에서 저장함 경고 표시, 사파리에서는 없음 |

## 발견 (심각도 순)

| # | 심각도 | 종류 | 문제 | 근거 | 고치는 방법 |
|---|---|---|---|---|---|
| 1 | 중간 | 버그 | DB에 닿지 않으면 `/api/saved` 가 글이 섞인 묶음 전체를 500으로 돌려, 뷰티·드라마·명소 행까지 전부 '불러오지 못함' | 끊긴 DB 서버(3401)에서 글1+카탈로그3 저장 → 4/4행 실패, 글 없는 요청은 200. `data/catalog.ts:65-72`(글 요약에 예외 처리 없음), `:131-135`, `app/api/saved/route.ts:23`. 캡처 `shots/dbdown-saved.png` | `summarizeMany` 에서 `articleSummaries` 를 try/catch(실패 시 빈 Map) — 카탈로그 요약은 DB 없이 나온다. 덤: 운영 오류 `53000`(한도 초과)은 `lib/item-votes.ts:93` `DB_UNAVAILABLE` 에 없어(어댑터가 `53300` 만 구분) 집계가 0 대신 예외로 떨어진다 — 코드 추가 검토 |
| 2 | 중간 | UX | 아이폰(WebKit)에서 여는 괄호가 줄 끝에 남는다: '淨膚雷射（ / Laser toning）', 'ボトックス（ / ボツリヌストキシン）', 'Коррекция птоза ( / операция' | `kinsoku.mjs`: WebKit iPhone 15 289곳/197쪽(zh-TW 138·ja 41·ru 15), SE 314곳, Chromium 0. 원인 `components/Phrase.tsx:21`, `components/guide/Words.tsx:7` 의 `word-break:keep-all` — WebKit은 단어 결합 문자(U+2060)도 무시(시험 HTML로 확인). 캡처 `zh-tw-crossrail.png`, `ja-clinic-row.png`, `ja-botox-h1.png`(WebKit) vs `-cr.png`(Chromium) | ① ko·ja·zh 외 언어는 `Words` 에서 keep-all 을 빼기 ② ja·zh 는 여는 괄호와 다음 글자를 `white-space:nowrap` span 으로 묶기 — 같은 시험 HTML에서 WebKit 정상 확인 |
| 3 | 낮음 | UX | 언어를 바꾸면 저장한 글이 '불러오지 못함' 빈 행 | 글 번역은 en·ja·zh-TW 112개, ko 15, ru 0(사이트맵). en에서 저장 → `/ru/saved` 1행 실패. `data/catalog.ts:64` 주석 '번역이 없으면 빠진다' | 그 언어 번역이 없으면 en 요약을 쓰고 링크를 `/en/news/…` 로, 또는 '이 언어로 없는 글 · 영어로 보기' 한 줄 |
| 4 | 낮음 | 결정 필요 | 투표 도배 제한이 IP당 시간당 30표 — 같은 IP의 다른 기기도 막힘 | 30표 뒤 31번째 429, 다른 UA 기기도 'That’s a lot of taps. Try again in a bit.'(`shots/rate-limit.png`). `lib/item-votes.ts:17,155` | 통신사 CGNAT·호텔 와이파이·드라마 24편 몰아 매기기를 고려해 `voterHash` 기준으로 세거나 한도 상향 |
| 5 | 낮음 | UX | 300개 상한에서 오래된 저장이 말없이 빠지고, '나에게 보내기' 링크는 최신 100개만 복원 | F4. `lib/saved.ts:21,23,48`, `components/saved/sendList.ts:23,39` | 100개 넘으면 '최신 100개만 담겨요', 상한 도달 시 토스트 한 줄 |
| 6 | 낮음 | 접근성 | 피부 타입 테스트에 이름이 'Back'(戻る)인 버튼이 둘 — 상단은 테스트를 나가고 본문은 이전 문항 | F6에서 2개 확인. `components/quiz/Quiz.tsx:119`, `beauty/skin-type/page.tsx:59` | 본문 버튼 문구 `Beauty.quiz.back` 을 'Previous question'(前の質問) 으로 |
| 7 | 낮음 | 디자인 | ja 좁은 화면에서 단어 중간 줄바꿈: 'リップスリーピン / グマスク', '（韓 / 国の定価）' | SE `/ja/beauty` (`shots/wk-se-ja-beauty.png`). `data/beauty/text/ja.json:262`, `app/[locale]/beauty/page.tsx:113`(priceLegend 가 `Words` 미사용) | 긴 가타카나 이름에 공백('リップ スリーピング マスク'), priceLegend 를 `Words` 로 |
| 8 | 낮음 | UX | 시술 질문 안내가 '이 페이지를 저장하면 목록을 다시 찾는다'인데 체크는 새로고침하면 사라짐 | `messages/ns/Clinic/en.json:86`, `components/clinic/QuestionChecklist.tsx:19-20` | 문구를 '체크는 이 화면에서만 남아요'로(9개 언어) |
| 9 | 낮음 | 결정 필요 | 피부 타입 공유 이미지가 모든 언어에서 영어('My skin type: SENSITIVE'), alt 도 영어 — ja·zh-TW 는 LINE 으로 먼저 보내는데 미리보기가 영어 | 45장 해시 동일(언어별 5장 같음). `opengraph-image.tsx:7-10`(CJK 폰트 안 실음이 의도) | 결과 이름 5개 글자만 서브셋 폰트로 싣는 비용 vs 공유 클릭률 판단 |
| 10 | 낮음 | UX | /partners·/disclosure 에서 하단 '홈' 탭이 켜져 보임 | F13. `components/TabBar.tsx:44-50` | 정보 페이지는 어떤 탭도 켜지 않기 |

## 시험 도구 한계 (결함 아님)

| 현상 | 판단 |
|---|---|
| WebKit에서 그냥 Tab 으로는 테스트 보기·시트 버튼에 닿지 않음 | 사파리 기본 설정(버튼·링크는 Option+Tab). Option+Tab 으로 F5·F6 전부 통과 |
| webkit 데스크톱 F2 '목록 공유'·F6 en 결과 공유 실패 | 맥 사파리는 `navigator.share` 가 있어 공유 시트를 부름(헤드리스에서 기록 안 됨). 실제 동작 정상 |
| F8 첫 화면 '1 rating' → 투표 뒤 '6 ratings' | 상세 HTML 1시간 캐시(REVIEW-LEFT에서 이미 다룸). 내 표가 있으면 다시 받아 맞춤 |

## 그 밖에 확인한 것

- 제휴: 파트너별 노출 — YesStyle 9개 언어, Olive Young 9개, Amazon en 63개만, Klook·Creatrip·Trip.com·Airalo 9개. **추적값이 붙은 링크 0개**(로컬 환경변수 없음) — 운영 Vercel 에 `AFFILIATE_*` 를 넣기 전에는 클릭 수익이 없다(`RESULT.md` '운영 반영 전 할 일 3').
- 다크 모드: 토스트·언어 제안 띠는 반전색(흰 바탕) — 의도된 디자인. 탭바 뒤 글자가 옅게 비치지만 읽히지 않는 수준.
- 피부 타입 시트는 SE(667px)에서 5개 타입+건너뛰기 모두 보임(맨 아래 633px).
- 로컬 DB에 시험 표 약 100개(드라마·뷰티·시술, `x-real-ip 10.x`)가 들어갔다. 미리보기 집계가 부풀어 보일 수 있다(운영 DB와 무관).

## 다시 돌리기

`/tmp/qa-flows` 에 `paths.txt`·`article-slugs.txt`·`catalog-ids.json`·`seed.json` 을 두고(보관본 `~/Desktop/unnienote-preview/qa-flows/scripts/`):

```
node scripts/http-sweep.mjs
node scripts/sweep.mjs webkit iphone15 en,ja,zh-tw,ko,ru paths.txt wk-i15 5 && node scripts/analyze.mjs wk-i15
node scripts/flows.mjs webkit iphone15            # 흐름 전체 (f1…f13 골라 돌리기: 세 번째 인자)
node scripts/kinsoku.mjs webkit iphone15 ja,zh-tw,ko,ru,en ks-wk-i15
node scripts/affiliate.mjs ; node scripts/visual.mjs webkit iphone15 dark en,ja,ru
```

WebKit 은 `npx playwright install webkit`(2370) 을 설치했다.
