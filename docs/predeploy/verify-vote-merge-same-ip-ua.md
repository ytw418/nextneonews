# 검증: 같은 와이파이·같은 iOS 버전인 두 사람의 표가 하나로 합쳐진다

- 검증일: 2026-10-20 · 대상: `http://localhost:3400` (dev 최신 빌드, 로컬 DB) · 원 보고: `docs/predeploy/qa-edge.md:29` (#13), 같은 내용 `docs/predeploy/login.md:50`
- 결론: **재현됨. 실제 버그, 등급은 '낮음'**. 배포를 막을 일은 아니다. 다만 보고서의 수정안 "#2 기기 ID 를 voterHash 에 쓴다"는 그것만으로는 위험하고, 작업량도 S 가 아니다(아래 '수정안 평가' 참고)

## 1. 원인 (코드)

| 위치 | 내용 |
|---|---|
| `apps/web/src/lib/voter.ts:11-13` | `voterHash(scope, ip, ua)` = HMAC(`v:{scope}:{ip}:{ua}`). 이 값이 곧 투표자 신원이다 |
| `apps/web/src/lib/comments.ts:37-39` | `clientIp` = `x-real-ip` → `x-forwarded-for` 첫 값. Vercel 에서는 접속자의 공인 IP |
| `apps/web/src/lib/item-votes.ts:149` | `where = kind_itemId_voterHash`. 기본 키가 `(kind, itemId, voterHash)` (`docs/monetize/PLAN.md:160`) |
| `apps/web/src/lib/item-votes.ts:151-157` | 같은 해시의 행이 있으면 `upsert` 로 choice·facet 을 **덮어쓴다**. 같은 답이면 `counted:false` 로 아무것도 쓰지 않는다 |
| `apps/web/src/components/ItemVote.tsx:17,103` | 화면은 '내 답'을 각 기기 localStorage(`hb:vote:{kind}:{id}`)에 따로 기억한다 → 서버 표와 기기 표시가 어긋난다 |

## 2. 재현 (로컬, curl)

같은 UA(iOS 사파리 문자열)를 쓰고 `x-real-ip` 로 공인 IP 를 흉내 냈다. 항목 `beauty/round-lab-1025-dokdo-cleanser`, 시작 집계 0표.

```bash
B=http://localhost:3400/api/items/beauty/round-lab-1025-dokdo-cleanser
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'
curl -s -X POST $B/vote -H "content-type: application/json" -H "user-agent: $UA" -H "x-real-ip: 203.0.113.77" -d '{"choice":"love","locale":"zh-TW"}'
```

| # | 누가 | IP | UA | 답 | 응답 | 집계 (love/ok/meh, total) |
|---|---|---|---|---|---|---|
| 1 | 언니 A | 203.0.113.77 | iOS 사파리 26.0 | love | `counted:true, changed:false` | 1/0/0, **1** |
| 2 | 동생 B | 같음 | 같음 | meh | `counted:true, changed:true` | 0/0/1, **1** ← A 의 표가 사라짐 |
| 3 | 친구 C | 같음 | 같음 | meh | `counted:false` | 0/0/1, **1** ← C 의 표는 세지 않음 |
| 4 | 대조: 다른 IP | 203.0.113.78 | 같음 | love | `counted:true` | 1/0/1, 2 |
| 5 | 대조: 같은 IP, 다른 사파리 버전 | 203.0.113.77 | 사파리 18.5 | love | `counted:true` | 2/0/1, 3 |

- 3명이 투표했는데 1표만 남았다(#1~3). IP 나 UA 중 하나만 달라도 따로 센다(#4·5) → 원인은 IP+UA 신원 하나뿐이다.
- 화면: A 의 기기는 localStorage 에 `love` 가 남아 '내 답 = 인생템'으로 칠해지지만 서버 집계는 love 0 이다. 오류 표시는 없다.
- 정리: 시험 표 3건은 로컬 DB 에서 지웠다(`DELETE 3`, 집계 0/0/0 으로 복원 확인).

## 3. 운영에서도 생기는가

| 조건 | 확인 | 판단 |
|---|---|---|
| 같은 공인 IP | `dig AAAA unnienote.app` → 레코드 없음(A 만 `216.150.16.129`, `216.150.1.193`). 운영은 IPv4 전용 | 집 와이파이(NAT)·통신사 CGNAT·호텔·카페 와이파이의 기기들은 같은 `x-real-ip` 로 보인다. IPv6 로 기기마다 주소가 갈리는 구제책이 없다 |
| 같은 UA | 아이폰 사파리 UA 에는 기종이 없고 iOS·사파리 버전만 들어간다 | 같은 버전의 아이폰끼리는 UA 가 같다. 타깃(아이폰 여성)이 몰려 있어 겹칠 확률이 높다 |
| 같은 항목 | 기간 제한 없음(해시에 날짜가 없다) | 가족·친구가 같은 제품·드라마에 투표하면 시간이 지나도 겹친다 |
| 증폭 요인 [추정] | iCloud 비공개 릴레이(일본·대만 사파리) | 출구 IP 를 여러 사용자가 함께 쓰므로 겹칠 확률이 더 커진다(반대로 IP 가 바뀌면 같은 사람이 새 표를 낸다) |

로컬 환경 탓이 아니다. 운영에서는 Vercel 이 `x-real-ip` 를 넣으므로 같은 NAT 뒤 두 아이폰은 정확히 위 #1~3 과 같다.

## 4. 설계상 의도인가

| 문서 | 문장 | 판단 |
|---|---|---|
| `docs/monetize/PLAN.md:146` | "한 기기(voterHash)가 항목마다 한 번, 바꾸면 덮어쓴다" | 의도는 **기기마다 1표**. 서로 다른 두 기기가 1표로 합쳐지는 것은 의도와 어긋난다 |
| `apps/web/messages/ns/Trust/pages/en.json:105,109` (개인정보처리방침) | "to count one rating per device" | 독자에게도 '기기당 1표'라고 약속했다 |
| `docs/monetize/*.md` 전체 | IP 공유 때 표가 합쳐지는 것을 받아들인다는 결정 없음(`grep -i "NAT\|공용 IP\|voterHash"`) | 알고 받아들인 절충이 아니다 |

→ 설계 결정이 아니라 IP+UA 를 기기 신원으로 쓴 데서 오는 한계다. 투표·반응·응원(`PollVote`·`ReactionVote`·`CheerVote`, 2026-10-16 `c839535`)도 같은 구조라 이번 배포에서 새로 생긴 문제는 아니다. 같은 구조가 `ItemVote` 로 넓어지는 것이다.

## 5. 등급: 낮음 (원 보고 '낮음' 유지)

| 근거 | 내용 |
|---|---|
| 피해 | 겹칠 때마다 표 1개를 잃거나 뒤 사람 답으로 바뀐다. 데이터가 깨지거나 화면이 멈추지는 않는다 |
| 빈도 | 같은 항목·같은 공인 IP·같은 사파리 버전이 모두 맞아야 한다. 지금 트래픽(`BM-VALIDATION.md:202` 분모 129)에서는 드물다 |
| 반대 방향이 더 크다 | 같은 사람이 UA 만 바꿔 표를 늘리는 문제(`qa-edge.md:18`, #2 '높음')가 순위에 미치는 영향이 훨씬 크다. 이 버그는 표를 **줄이는** 쪽이라 순위를 뒤집기 어렵다 |
| 배포 | 막을 이유 없음. 운영 DB 가 한도 초과로 꺼져 있어 지금은 투표 자체가 503 이다 |

## 6. 수정안 평가 ("#2 의 기기 ID 를 voterHash 에 쓴다", S 30분)

| 쟁점 | 내용 |
|---|---|
| 그것만 하면 악용이 쉬워진다 | 브라우저가 보내는 기기 ID(localStorage 난수)는 요청마다 마음대로 바꿀 수 있다. IP+UA 대신 기기 ID 만 쓰면 스크립트로 ID 만 바꿔 무한히 투표할 수 있다. **IP 기준 상한(예: 같은 `ipHash` 는 항목당 최대 2~3표만 집계, `qa-edge.md:18` 제안)과 반드시 같이** 해야 한다 |
| 기존 표 이전 | 해시 공식이 바뀌면 이미 투표한 사람이 다시 누를 때 새 행이 생겨 2표가 된다. 옛 해시(IP+UA)도 함께 찾아 바꾸는 처리가 필요하다 |
| 사파리 7일 삭제 | localStorage 는 7일 미방문 때 지워진다(`BM-VALIDATION.md:34`) → 같은 사람이 새 기기 ID 로 다시 투표한다. HttpOnly 쿠키(`login.md:69` 안 B)가 더 오래간다 |
| 처리방침 | 9개 언어의 "hashed codes of your IP address and browser" 문장(`Trust/pages/*.json:108-109`)에 기기 ID 를 더해야 한다 |
| 작업량 | 클라이언트 ID 생성·전송, `ItemVoteInput` 스키마, 서버 해시, IP 상한, 옛 해시 처리, 방침 9개 언어 → **M(반나절)** 이 맞다. S(30분) 아님 |

권장: 내일 배포에는 넣지 않는다. #2(UA 바꿔 표 늘리기)를 고칠 때 'ipHash 당 항목별 상한 + 기기 ID(또는 HttpOnly 쿠키)'를 한 번에 설계하고, 그때 이 버그도 같이 닫는다.
