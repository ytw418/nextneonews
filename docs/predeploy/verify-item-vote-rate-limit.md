# 검증: 항목 투표 도배 제한(IP당 시간당 30표)

- 보고된 버그: "투표 도배 제한이 IP당 시간당 30표 — 같은 IP의 다른 기기도 막힘" (낮음·결정 필요)
- 검증일: 2026-10-20, 대상: `http://localhost:3400` (dev 최신 빌드, 로컬 DB)
- **판정: 버그 아님(real=false).** 동작은 그대로 재현되지만 `docs/monetize/PLAN.md:174` 에 적힌 설계 결정이고, 제안된 수정(IP+UA 기준)은 오히려 도배 제한을 무력화한다.

## 1. 재현 결과

테스트용 IP 를 `x-real-ip` 헤더로 고정(Vercel 운영도 같은 헤더로 실제 IP 를 넣는다, `apps/web/src/lib/comments.ts:36-39`).

```bash
curl -X POST http://localhost:3400/api/items/drama/<slug>/vote \
  -H 'content-type: application/json' -H 'x-real-ip: 198.51.100.231' \
  -H 'user-agent: <iPhone Safari UA>' -d '{"choice":"4","locale":"en"}'
```

| 순서 | 요청 | 결과 |
|---|---|---|
| 1~24 | 같은 IP·같은 UA, 드라마 24편 별점 | 모두 200 `counted:true` |
| 25~30 | 같은 IP·같은 UA, 뷰티 6개 | 모두 200 |
| 31~34 | 같은 IP·같은 UA, 뷰티 4개 더 | 429 `{"error":"tooFast"}` |
| 추가 | 같은 IP·**다른 UA**(안드로이드 크롬) | 429 — 같은 IP 다른 기기도 막힘 |
| 추가 | 같은 IP·같은 UA, 이미 낸 답 다시 보냄 | 200 `counted:false` (세지 않음) |
| 추가 | **다른 IP**(198.51.100.232)·같은 UA | 200 |
| 추가 | `GET /api/items/drama/queen-of-tears` | 200 (집계 보기는 막히지 않음) |

로컬 DB 에 남은 행은 정확히 30개(`ItemVote.ipHash` 기준)였고, 확인 뒤 테스트 행 31개를 지웠다(`DELETE 31`).

화면 쪽: 429 이면 `apps/web/src/components/ItemVote.tsx:111` 이 "That’s a lot of taps. Try again in a bit."(`messages/ns/Engage/en.json:79`, 9개 언어 있음)를 보여 주고, 고른 답 표시는 되돌린다(`:115` `setPending(null)`). 표는 저장되지 않고, 가장 오래된 표가 한 시간을 넘기면 다시 낼 수 있다.

## 2. 설계상 의도인 근거

| 근거 | 위치 | 내용 |
|---|---|---|
| 계획 문서 API 계약 | `docs/monetize/PLAN.md:174` | `429 tooFast(ipHash 시간당 30)` — 기준(ipHash)과 한도(30)를 그대로 명시 |
| 계획 문서 스키마 | `docs/monetize/PLAN.md:162` | `@@index([ipHash, createdAt])` — IP 해시로 세려고 둔 인덱스 |
| 공통 도우미 원칙 | `apps/web/src/lib/voter.ts:7-8` | "한 기기 한 표는 voterHash, **도배 제한은 ipHash** 로 본다" |
| 코드 주석 | `apps/web/src/lib/item-votes.ts:16-17` | "같은 사람(IP 해시)이 한 시간에 … 30" |
| 다른 참여 기능과 같은 틀 | `apps/web/src/lib/engagement.ts:17-18`, `apps/web/src/app/api/cheer/[entityId]/route.ts:10-12` | 글 투표 30/시간, 반응 60/시간, 응원 20/시간 — 모두 ipHash 기준 |

보고자도 종류를 "결정 필요"로 적었다. 동작이 문서와 어긋난 곳은 없다.

## 3. 제안된 수정이 맞지 않는 이유

| 제안 | 문제 |
|---|---|
| voterHash(IP+UA) 기준으로 세기 | 한 기기 한 표가 이미 IP+UA(`voter.ts:11-13`)라서, UA 를 요청마다 바꾸는 스크립트는 같은 항목에 표를 무한히 낼 수 있다. 지금 그걸 막는 유일한 상한이 IP 기준 30표다. 기준을 IP+UA 로 바꾸면 그 상한이 사라진다. UA 는 위조가 쉽고, `isBot`(`voter.ts:20-25`)은 `curl`·`python` 같은 글자만 거른다. |
| 한도 100 | 가능하지만 지금 근거가 없다. 아래 영향 범위를 보면 30 으로 막히는 실사용자는 거의 없고, 100 이면 IP 하나가 시간당 드라마 24편 전부를 네 번씩 흔들 수 있다(별점 평균이 표 수 적은 지금 크게 움직인다). |

## 4. 실제 영향 범위(운영 기준)

| 상황 | 30표에 닿는가 |
|---|---|
| 한 사람이 몰아 매기기 | 드라마 24편 전부 + 다른 항목 7개를 한 시간 안에 해야 닿는다. 답을 바꿔도 1표로 센다(`voter.ts:40-41` updatedAt). 드물다. |
| 아이폰 모바일 데이터(일본·미국·대만 통신사) | IPv6 를 기기마다 받는 경우가 많아 IP 해시가 기기마다 다르다. |
| CGNAT·호텔 와이파이(IPv4 공유) | 같은 IP 의 **여러 사람이 같은 시간에 이 사이트에서** 합쳐 30표를 내야 막힌다. 지금 방문자 규모에서는 일어나기 어렵다. |
| 막혀도 | 집계 보기·저장·읽기는 그대로. 투표만 한 시간 뒤 다시 가능. |

## 5. 결론·권고

- 버그로 올리지 않는다. 배포를 막을 이유도 없다.
- 나중에 투표 수가 늘어 실제 429 가 보이면 그때 판단한다. 판단 재료는 Vercel 로그의 `/api/items/*/vote` 429 건수(돈 안 드는 확인). 올릴 때도 기준은 ipHash 로 두고 한도만 조정한다(예: 30 → 60, 반응과 같은 수준).
- 운영 DB(Neon)가 지금 한도 초과로 꺼져 있어 운영에서는 투표 자체가 503 이다(`item-votes.ts:162`). 이 제한보다 그쪽이 먼저다.
