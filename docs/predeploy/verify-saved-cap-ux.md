# 검증: 300개 상한에서 오래된 저장이 말없이 빠지고, '나에게 보내기' 링크는 최신 100개만 복원한다

- 대상 보고: 심각도 '낮음', 종류 'UX', 위치 `apps/web/src/lib/saved.ts:21,23,48`, `apps/web/src/components/saved/sendList.ts:23,39`
- 검증일: 2026-10-20, 서버 `http://localhost:3400` (dev 최신 빌드, 로컬 DB). 코드는 고치지 않았다.
- 결론: **두 현상 모두 재현된다. 하지만 두 상한(300·100)은 기획 문서와 테스트에 정해 둔 설계다. 배포 직후에는 해당하는 사용자가 없다 → real=false, 낮음.** 안내 문구 추가는 배포 뒤 개선 과제로 둔다.

## 1. 재현 (직접 실행)

스크립트는 `/tmp/verify-saved-cap-ux/run.mjs`(WebKit, iPhone 15)이고 `node /tmp/verify-saved-cap-ux/run.mjs` 로 돌렸다. 항목은 `/sitemap.xml` 의 실제 slug로 채웠고, 모자란 칸은 형식만 맞는 글 slug로 채웠다. 클립보드는 init script 로 가로채 복사된 주소를 읽었다.

### A. 300개가 찬 상태에서 하트 하나 더 (`/en/beauty/p/cosrx-low-ph-good-morning-gel-cleanser`)

| 항목 | 결과 |
|---|---|
| 토스트 | `Saved "Low pH Good Morning Gel Cleanser"` + `View` (평소 문구와 같다) |
| 저장 수 | 300 → 300 |
| 새 항목 위치 | 맨 앞 |
| 빠진 항목 | 가장 오래된 1개(#299) — 안내 없음 |
| 화면 | `/tmp/verify-saved-cap-ux/A-toast.png` |

### B. '나에게 보내기'(en = 링크 복사) → 빈 브라우저에서 복원

| 저장 수 | h1 | 복사 토스트 | 링크 길이 | 링크에 담긴 수 | 새 기기 배너 | 복원 |
|---|---|---|---|---|---|---|
| 100 | Saved 100 items | Link copied. Paste it into Notes… | 8,004자 | 100 | A shared list with 100 picks | 100/100 |
| 150 | Saved 150 items | 같음 | 8,004자 | 100 | 같음 | **100/150** |
| 300 | Saved 300 items | 같음 | 8,004자 | 100 | 같음 | **100/300** |

보내기 버튼 근처에는 '최신 100개만 담긴다'는 안내가 없다(`/tmp/verify-saved-cap-ux/B-150-send.png`).

보고된 링크 길이 4,205자는 짧은 카탈로그 id 위주였을 때의 값으로 보인다. 운영 영어 글 slug 303개의 평균 키 길이는 60자다. 글 100개면 약 8,000자가 나오고, 이번 측정값과 같다.

## 2. 원인 (코드)

| 위치 | 내용 |
|---|---|
| `apps/web/src/lib/saved.ts:21` | `SAVED_MAX = 300; // 넘으면 가장 오래된 것부터 뺀다` |
| `apps/web/src/lib/saved.ts:38-48` | `normalize` 가 최신순으로 정렬한 뒤 `.slice(0, SAVED_MAX)` 로 자른다 |
| `apps/web/src/components/SaveButton.tsx:50-68` | `toggleSaved` 결과(저장 여부)만 보고, 잘려 나간 항목이 있는지는 보지 않는다. 토스트는 늘 같다 |
| `apps/web/src/lib/saved.ts:23,79` | `SAVED_SHARE_MAX = 100; // 공유 링크 하나에 담는 수 (주소 길이)`, `items.slice(0, SAVED_SHARE_MAX)` |
| `apps/web/src/components/saved/sendList.ts:23,37-39` | 주석 "최신 SAVED_SHARE_MAX 개". `count` 는 분석 이벤트에만 쓰고 화면에는 보이지 않는다 |

## 3. 설계상 의도라고 본 근거

| 근거 | 내용 |
|---|---|
| 300개 상한 | `docs/monetize/PLAN.md:12` "저장은 `hb:saved` 한 키(… 300개 상한)", `PLAN.md:191` `SAVED_MAX = 300` |
| 오래된 것부터 뺀다 | `saved.ts:21` 주석. `apps/web/src/lib/saved.test.ts:19` "상한을 넘으면 가장 오래된 것부터 뺀다"를 테스트로 고정했다 |
| 공유 링크 100개 | `PLAN.md:199` `encodeSavedShare … // "kind:id,kind:id" → base64url, 최대 100`. `PLAN.md:225` `/api/saved` 의 `items` 도 "≤100" |
| 나에게 보내기도 같은 링크 | `docs/monetize/BM-VALIDATION.md:157` '나에게 보내기'는 기존 `?i=` 링크를 그대로 쓴다고 정했다. 따라서 100개 상한도 그대로 따른다 |
| 상한 안내는 기획에 없다 | `docs/monetize/{PLAN,DESIGN,RESULT,REVIEW-LEFT}.md` 어디에도 상한 안내 문구 요구가 없다. `REVIEW-LEFT.md` 에 남은 저장 과제는 '없는 항목 걸러내기'(9행)뿐이다 |
| 같은 정책의 앞선 판정 | `docs/predeploy/verify-saved-import-cap.md` — 300개 상태에서 가져오기 때문에 항목이 빠지는 현상도 같은 상한 정책으로 보고 real=false 로 판정했다 |

## 4. 운영에서 실제로 생길 가능성

| 항목 | 값 |
|---|---|
| 저장 기능 공개 | 이번 배포가 처음이다. 저장은 기기 localStorage 에만 있어 배포 직후 100개를 넘게 가진 사용자는 0명이다 |
| 저장할 수 있는 항목 | 운영 영어 색인 글 303개(`curl -s https://unnienote.app/sitemap.xml \| grep -c /en/news/`) + 이번에 붙는 카탈로그 132개 ≈ 435개 |
| 300개 상한에 닿는 조건 | 하트를 하나씩 301번 눌러야 한다(전체의 약 70%) |
| 100개 상한에 닿는 조건 | 101개 이상 저장한 뒤 보내야 한다. 300개보다는 현실적이지만, 첫 몇 주 안에는 드물다 |
| 잃는 것 | A: 가장 오래된 저장 1개(301번째 하트를 누를 때마다). B: 다른 기기로 옮길 때 최신 100개 밖의 항목. 원래 기기에는 그대로 남는다 |

## 5. 다만 남는 UX 틈 (배포 뒤 개선 거리)

| 관찰 | 근거 |
|---|---|
| 첫 저장 토스트는 "Send yourself the link so you don't lose it", 앱 안 브라우저 안내는 "Send yourself the link to keep them"이다. 저장이 100개를 넘으면 이 약속이 일부만 지켜진다 | `apps/web/messages/ns/Engage/en.json:84,89` |
| 링크 복사 토스트와 복원 배너 모두 개수 차이를 알리지 않는다 | 위 B 표 |

## 6. 판정

| 항목 | 값 |
|---|---|
| 재현 | 됨 (A·B 모두) |
| 성격 | 기획에 정한 상한(300·100)이 그대로 동작한 결과다. 정의되지 않은 오동작이 아니다. 빠진 것은 '상한 안내 문구'라는 개선 거리다 |
| 배포 영향 | 없음. 배포 직후 해당 사용자는 0명이다 |
| real | **false** |
| 심각도 | 낮음 |

## 7. 나중에 다듬는다면 (선택, 배포 뒤)

| 방안 | 내용 | 비용 |
|---|---|---|
| 보내기 안내 | `readSaved().length > SAVED_SHARE_MAX` 이면 보내기 버튼 아래에 "최신 100개만 담겨요" 한 줄을 둔다(`Engage` 9개 언어에 키 1개) | S |
| 상한 토스트 | `toggleSaved` 직전 길이가 `SAVED_MAX` 이면 저장 토스트 대신 "가장 오래된 저장 1개가 빠졌어요"를 띄운다(키 1개) | S |
| 링크 나누기 | 100개 넘으면 링크를 여러 개로 나눈다. 주소가 약 8,000자라 LINE 공유 길이도 함께 봐야 한다 | M |
| 할지 판단 | PostHog `saved_share`·`saved_view` 의 `count` 분포를 보고 100개를 넘는 사용자가 생기면 한다 | — |
