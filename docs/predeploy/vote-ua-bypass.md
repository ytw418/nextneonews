# 검증: UA만 바꾸면 새 표로 센다 (항목 투표 조작)

- 검증일: 2026-10-20 00:06 KST, 대상 `http://localhost:3400` (`/private/tmp/unnie-final`, dev `1bb6006` 빌드, 로컬 DB `localhost:54329/kmedia`)
- 판정: **실제 버그 (real=true)**. 심각도는 보고된 '높음'보다 한 단계 낮춘 **중간**으로 본다. 배포를 막을 정도는 아니고, 배포 뒤 1주 안에 고치면 된다
- 코드는 고치지 않았다. 시험으로 넣은 로컬 표 30개는 끝나고 지웠다(아래 '정리')

## 1. 재현 (같은 IP 하나, UA 끝만 바꿈)

IP는 `x-real-ip: 198.51.100.77` 하나로 고정했다. 운영에서는 Vercel이 실제 IP를 넣으므로 IP를 바꾸는 시험은 하지 않았다. UA는 아이폰 사파리 UA 끝에 ` qa-1`, ` qa-2`… 를 붙였다.

```bash
vote(){ curl -s -X POST "http://localhost:3400/api/items/beauty/$1/vote" -H 'content-type: application/json' \
  -H "x-real-ip: 198.51.100.77" -A "$2" -d "{\"choice\":\"$3\",\"locale\":\"en\"}" -w " [%{http_code}]"; }
```

| 단계 | 요청 | 결과 |
|---|---|---|
| A | 같은 UA로 `skin1004-madagascar-centella-toning-toner` love 2번 | 1번째 `counted:true` total 1, 2번째 `counted:false`. 같은 UA면 한 표로 묶인다 |
| B | UA 끝만 바꿔 같은 제품에 love 14번 | 14번 모두 `counted:true`, love 1→15 |
| C | UA 끝만 바꿔 1위 `anua-heartleaf-77-soothing-toner` 에 meh 15번 | 15번 모두 `counted:true`, meh 0→15 |
| D | 31번째 요청 (새 UA) | `429 {"error":"tooFast"}`. 막는 장치는 IP당 한 시간 30표뿐이다 (`item-votes.ts:17,155`) |

## 2. 결과: 토너 분류 순위 (실제 `rankAwards`·`readerRating` 함수로 계산)

`tsx` 로 `apps/web/src/lib/beauty.ts` 의 함수를 그대로 불러 API 집계(`GET /api/items/beauty/<slug>`)를 넣었다.

| 순위 | 투표 전 | 점수 | 투표 후 (한 IP, 30요청, 1초) | 점수 | 독자 별점 |
|---|---|---|---|---|---|
| 1 | anua-heartleaf-77 | 101.14 | **skin1004 toning toner** | 96.75 | **5.0 (15표)** |
| 2 | round-lab-1025-dokdo | 93.00 | round-lab-1025-dokdo | 93.00 | 없음 |
| 3 | medicube-zero-pore-pad | 92.00 | medicube-zero-pore-pad | 92.00 | 없음 |
| 4 | torriden-dive-in-toner | 80.00 | torriden-dive-in-toner | 80.00 | 없음 |
| 5 | skin1004 toning toner | 78.00 | **anua-heartleaf-77** | 79.23 | **1.5 (17표)** |

- 꼴찌가 1위로, 1위가 꼴찌로 바뀌었다.
- 분류 표 합계가 2 → 32가 되어 `AWARDS_MIN_VOTES = 30`(`beauty.ts:37`)을 넘는다. 제목도 'Editors' Picks'에서 '어워드'로 바뀐다(`awards/[category]/page.tsx:43`).
- 두 제품 모두 `readerRating` 이 값을 돌려준다(`beauty.ts:85-89`). 그래서 `productLd`(`jsonld-catalog.ts:57-66`, `beauty/p/[slug]/page.tsx:90,111-117`)가 `aggregateRating` 을 넣는다. 화면 별점 문구(`:177-179`)도 같은 값이다.
- ISR(`revalidate = 3600`)이라 화면에는 최대 1시간 뒤에 반영된다. 지금 캐시된 페이지는 `x-nextjs-cache: HIT`였고 23:12에 만들어져 바뀌지 않았다. 이 지연은 조작을 막지 못한다. 반영을 늦출 뿐이다.

## 3. 원인

| 항목 | 근거 |
|---|---|
| 한 기기 판정이 IP와 UA의 HMAC이다. UA는 클라이언트가 마음대로 정한다 | `lib/voter.ts:11-13`, `lib/item-votes.ts:149` |
| 집계는 행 수를 그대로 센다. 같은 `ipHash` 가 낸 표도 모두 센다 | `lib/item-votes.ts:101-109` (`groupBy itemId, choice, facet`) |
| 봇 거르기는 UA 문자열 정규식뿐이라 UA를 바꾸면 통과한다 | `lib/voter.ts:20-25` (`bot\|crawler\|spider\|curl\|python`) |
| 한도는 한 시간에 30표다. 하루면 IP 하나로 720표를 넣을 수 있다 | `lib/item-votes.ts:17`, `voter.ts:30-42` |
| 30표면 점수가 +21.4점 오른다(25×30/35). 분류 안 편집 점수 차이는 최대 19점이다(76~95) | `beauty.ts:46-51`, `data/beauty/items.ts` |

## 4. 설계상 의도인지

| 확인한 문서 | 내용 | 판단 |
|---|---|---|
| `docs/monetize/PLAN.md:146,175` | "한 기기(voterHash)가 항목마다 한 번" | UA만 바꿔 여러 번 내는 것은 이 의도를 어긴다 |
| `PLAN.md:181`, `beauty.ts:34` | 분모 +5는 "한두 표로 순위가 뒤집히지 않게" | 한 사람이 30표를 넣는 경우는 고려하지 않았다 |
| `BM-VALIDATION.md:56,151`, `RESULT.md:14` | "우리 자산은 실제 투표 집계", "랭킹·어워드 자리는 팔지 않습니다" | 조작된 순위는 이 약속과 맞지 않는다 |
| `REVIEW-LEFT.md` | 투표 관련 항목은 문구·새로고침·분석 전송뿐이다 | 조작 위험을 받아들인다는 결정은 없다 |

설계 문서 어디에도 이 한계를 받아들인다는 결정이 없다. 운영에서도 그대로 재현된다. 로컬에서만 생기는 문제가 아니다.

## 5. 심각도를 '중간'으로 낮춘 이유

| 높이는 요인 | 낮추는 요인 |
|---|---|
| curl 한 줄이면 된다. 도구도 계정도 필요 없다 | 개인정보 유출이나 금전 피해는 없다. 피해는 순위·별점 신뢰다 |
| 수익 화면(제휴 링크가 달린 어워드)과 구글 별점에 바로 반영된다 | 출시 직후라 트래픽이 거의 없다. 노릴 동기가 있는 사람(경쟁 브랜드·팬덤)이 아직 적다 |
| 드라마 별점·시술 관심 투표도 같은 경로다 | 드라마는 구조화 데이터에 별점을 넣지 않는다(`tvSeriesLd`). 구조화 데이터 별점은 뷰티 제품에만 나간다 |
| | 분석에서 `ipHash` 가 같은 행이 몰린 것으로 찾아내고 지울 수 있다(행에 `ipHash`·`createdAt` 이 남는다) |

## 6. 고치는 방법 (제안 수정에 대한 의견)

| 제안 | 의견 |
|---|---|
| `queryTotals` 에서 같은 `ipHash` 의 표를 항목마다 제한한다 | **맞다. 가장 작은 수정이다.** `groupBy` 대신 `$queryRaw` 로 `SELECT DISTINCT ON ("itemId","ipHash") … ORDER BY "updatedAt" DESC` 한 뒤 `choice`·`facet` 으로 센다. 그러면 IP 하나는 항목마다 마지막 1표만 센다. `castItemVote` 응답, `readerRating`, `isEditorsPick`, `aggregateRating` 이 모두 `queryTotals` 를 거치므로 한 곳만 고치면 된다. 저장된 행은 그대로 두므로 되돌릴 수 있다 |
| '최대 2표' | 2표면 조작 효과가 반만 줄 뿐 남는다. 1표(마지막 표)가 더 단순하다. 통신사 공용 IP를 쓰는 사람들의 표가 1표로 합쳐지는 손해는 있다. 하지만 사파리 26은 UA를 고정한다(`login.md:35`). 그래서 아이폰 사용자는 지금도 같은 IP면 사실상 한 표다. 줄어드는 정확도는 거의 없다 |
| 기기 ID(localStorage 난수)를 UA 대신 쓴다 | **조작은 막지 못한다.** 기기 ID도 클라이언트가 정하는 값이라 요청마다 바꾸면 그만이다. 같은 와이파이 표 합침(qa-edge #13)만 푼다. 보안 수정과 따로 다뤄야 한다 |
| 투표·반응·응원도 같이 고친다 | 이 세 가지는 이번 배포 전부터 있던 기능이다. 순위나 구조화 데이터에 쓰이지 않아 급하지 않다 |

검증 방법(고친 뒤): §1 의 B·C 단계를 다시 돌린다. `counted:true` 가 와도 `total` 이 1에서 늘지 않으면 고쳐진 것이다. 새 SQL은 DB에 의존해 단위 테스트로 보기 어렵다. 그래서 위의 API 재현을 회귀 확인으로 쓴다. `tallyVotes` 를 시험하는 기존 테스트는 없다.

## 7. 정리

로컬 DB에 넣은 30행(`ipHash = a79631ea14b61e61`, 2026-10-19 15:06:38~40 UTC)은 지웠다. 삭제 뒤 `GET /api/items/beauty/anua-heartleaf-77-soothing-toner` 는 love 2, `…/skin1004-madagascar-centella-toning-toner` 는 0으로, 시험 전과 같다.
