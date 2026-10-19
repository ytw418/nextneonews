# 검증 — DB 가 꺼지면 저장함에 글이 하나라도 있으면 같은 묶음 전체가 '불러오지 못함'

2026-10-20 KST. 다른 QA 가 낸 버그를 회의적으로 다시 재현했다. 코드는 고치지 않았다.

## 결론

| 항목 | 판정 |
|---|---|
| 재현되는가 | **된다.** 한도 초과(53000)든 연결 불가든, 저장 목록에 글이 1개라도 있으면 `/api/saved` 가 500 을 주고 저장함 4줄이 모두 'Couldn’t load this one' 이 된다 |
| 설계 의도인가 | 아니다. 라우트 주석(`apps/web/src/app/api/saved/route.ts:10-11`)은 "한 칸 때문에 나머지까지 못 불러오지 않게"를 목표로 한다. 투표 API 는 DB 불통을 잡아 화면이 죽지 않게 하라고 정해 두었다(`docs/monetize/PLAN.md:179`). 저장함만 이 원칙이 빠졌다 |
| 운영과 관계있는가 | 있다. 운영 로그에 남은 오류(`P2039`/53000, `docs/predeploy/verify-db-unavailable-p2039.md`)와 같은 오류가 `prisma.translation.findMany()` 에서 난다 |
| 심각도 | **낮음**(QA 는 '중간'). 아래 '영향 범위' 참고 |
| 배포를 막는가 | 막지 않는다 |

## 원인 (코드)

| 위치 | 내용 |
|---|---|
| `apps/web/src/data/catalog.ts:65-73` | `articleSummaries` 가 `prisma.translation.findMany` 를 예외 처리 없이 부른다. 글 slug 가 0개면 DB 를 부르지 않는다(`:66`) |
| `apps/web/src/data/catalog.ts:131-135` | `summarizeMany` 가 글 요약을 먼저 기다리므로, 이 쿼리가 던지면 뷰티·여행·시술·드라마 요약까지 함께 사라진다. 이 넷은 JSON 파일만 읽는다(`data/beauty/index.ts:13-16` 등, `data/` 안에서 prisma 를 쓰는 곳은 `catalog.ts` 하나) |
| `apps/web/src/app/api/saved/route.ts:23` | 잡지 않으므로 500 |
| `apps/web/src/components/saved/summaries.ts:38,60-63` | 500 이면 그 묶음(최대 100개) 전체를 `null` 로 둔다 → `SavedRow.tsx:46-47` 이 'Couldn’t load this one'(`messages/ns/Engage/en.json:61`) |

## 재현

같은 빌드(`1bb6006`, `/private/tmp/unnie-final`, 3400 과 같은 `.next`)를 포트만 바꿔 띄웠다. 3400 은 건드리지 않았다.

- 3413: `DATABASE_URL=postgresql://u:p@127.0.0.1:55434/db` + `python3 -I /tmp/qa-edge/sim/fakepg.py 55434`(SQLSTATE 53000 을 돌려주는 가짜 Postgres)
- 3414: `DATABASE_URL=postgresql://u:p@127.0.0.1:1/db`(닫힌 포트)

### API (`curl`)

요청 항목: 글 `bibi-weight-gain-after-waterbomb-pego-show-7d2c41`, 뷰티 `cosrx-low-ph-good-morning-gel-cleanser`, 드라마 `queen-of-tears`, 명소 `kwangya-seoul`, 시술 `laser-toning`.

| 서버 | 글+뷰티+드라마+명소 | 뷰티+드라마+명소+시술(글 없음) | 글 1개 |
|---|---|---|---|
| 3400 정상(로컬 DB) | 200, 4개 | 200, 4개 | 200, 1개 |
| 3413 한도 초과 | **500, 0개** | 200, 4개 | **500** |
| 3414 연결 불가 | **500, 0개** | 200, 4개 | **500** |

서버 로그(`/tmp/verify-saved-dbdown/next-341{3,4}.log`):

| 서버 | 오류 |
|---|---|
| 3413 | ``Invalid `prisma.translation.findMany()` `` · `code: 'P2039'` · `Database error. Code: 53000 … exceeded the data transfer quota` |
| 3414 | 같은 `findMany` · `code: 'P1001'` · `DatabaseNotReachable` |

500 응답에는 `cache-control` 이 붙지 않아 CDN 에 남지는 않는다(`curl -sI` 확인).

### 화면 (아이폰 13 에뮬레이션, `/en/saved`, `localStorage["hb:saved"]` 를 미리 채움)

스크립트 `/tmp/verify-saved-dbdown/scripts/saved.cjs`.

| 서버 | 저장 목록 | `/api/saved` | 'Couldn’t load this one' 줄 | 캡처 |
|---|---|---|---|---|
| 3400 | 글+뷰티+드라마+명소 | 200 | 0/4 | `/tmp/verify-saved-dbdown/saved-3400-withArticle.png` |
| 3413 | 글+뷰티+드라마+명소 | 500 | **4/4** | `/tmp/verify-saved-dbdown/saved-3413-withArticle.png` |
| 3413 | 뷰티+드라마+명소 | 200 | 0/3 | `/tmp/verify-saved-dbdown/saved-3413-noArticle.png` |
| 3414 | 글+뷰티+드라마+명소 | 500 | **4/4** | `/tmp/verify-saved-dbdown/saved-3414-withArticle.png` |
| 3414 | 뷰티+드라마+명소 | 200 | 0/3 | `/tmp/verify-saved-dbdown/saved-3414-noArticle.png` |

저장함 화면 뼈대(`/en/saved`)는 DB 가 꺼져도 200 이다(미리 그려 둔 화면). 깨지는 것은 줄 내용뿐이다. QA 의 결과(4/4, 500, 글 없으면 200)와 같다.

## 영향 범위 — '중간'이 아니라 '낮음'으로 본 이유

| QA 주장 | 판정 | 근거 |
|---|---|---|
| DB 가 꺼진 동안 저장함 뷰티·여행·드라마 줄이 통째로 깨진다 | 맞다 | 위 재현 |
| "**지금** DB 한도 초과 상태에서" 저장함이 깨지는 것을 막는다 | **틀리다** | 운영에는 아직 저장함이 없다. `https://unnienote.app/en/saved` → 404, `/api/saved` → 404, `main` 에 `api/saved/route.ts` 없음(`git show main:…` 실패). DB 가 꺼져 있는 동안은 Vercel 빌드가 DB 조회에서 실패하므로 이 코드가 배포될 수도 없다 |
| 재발 가능성 | 있다 | `docs/predeploy/cost.md:7-10`: 봇이 ISR 재생성을 계속 일으키는 구조라 §7 을 고치지 않으면 다음 결제 주기에도 한도를 다시 넘길 수 있다. 그때 이 버그가 드러난다 |
| 장애 중 화면 전체 상황 | 저장함만의 문제가 아니다 | 장애 중에는 새 글이 안 나오고, 모든 화면 재생성이 `listActiveCategories` 에서 실패하며, 투표 API 도 500 이다(`verify-db-unavailable-p2039.md`). 저장함은 그중 작은 일부다 |
| 배포 직후 사용자 | 거의 없다 | 저장함은 새 기능이라 배포 직후에는 저장 목록이 빈 사람이 대부분이다 |

정리하면, 진짜 버그이고 고치기 쉽지만(30분 이하), 나타나는 때가 'DB 장애 중'으로 한정되고 그때는 사이트 전체가 이미 망가져 있다. 그래서 배포를 막지 않으며 심각도는 낮음으로 본다.

## 고칠 때 (다음 작업)

| 안 | 평가 |
|---|---|
| `summarizeMany` 에서 `articleSummaries` 를 try/catch 로 감싸고, 실패하면 빈 `Map` 을 쓴다(QA 안) | 권한다. 글 줄만 'Couldn’t load' 가 되고 카탈로그 줄은 살아서 미리 그려 둔 가이드 화면으로 이어진다. 오류는 삼키지 말고 서버 로그로 남긴다 |
| 위와 함께: 글 조회가 실패한 응답에는 `cache-control: no-store` 를 단다 | **같이 해야 한다.** 지금 성공 응답은 `s-maxage=300, stale-while-revalidate=600`(`route.ts:26`)이다. 빈 글 결과가 CDN 에 남으면 DB 가 돌아온 뒤에도 최대 15분 동안 글 줄이 'Couldn’t load' 로 보인다. `summarizeMany` 가 실패 여부를 함께 돌려주게 하면 된다 |
| QA 의 '덤'(`lib/item-votes.ts:93` `DB_UNAVAILABLE` 에 53000 이 없음) | 이미 따로 확인된 건이다(`verify-db-unavailable-p2039.md`, 판정 '있음·낮음'). 저장함 라우트는 `isDbUnavailable` 을 쓰지 않으므로 이 버그와는 별개다. `P2039` 를 통째로 넣지 말고 `meta.driverAdapterError.cause.originalCode` 로 판정하는 쪽을 그 보고서가 권한다 |

테스트: `summarizeMany` 에 "글 조회가 던지면 카탈로그 항목은 그대로 돌려준다" 케이스 1개만 더한다(버그 재발 방지용).

## 정리한 것

임시 서버(3413·3414)와 가짜 DB(55434)는 껐다. 3400 은 그대로 200 이다. 로그·캡처·스크립트는 `/tmp/verify-saved-dbdown/` 에 있다.
