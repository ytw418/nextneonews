# 비용 점검 — 운영 배포 전 (2026-10-19, 비용 관점)

점검·측정만 했다(코드 수정 없음). 시각은 KST. 금액은 USD, 원화는 `budget.ts` 와 같은 1,500원/$.

## 요약

- 운영 DB 가 꺼진 근본 원인은 **봇이 ISR 재생성을 계속 일으켜 DB 가 하루 24시간 깨어 있는 구조**다. 한도 초과 뒤 Vercel 실패 렌더는 시간당 약 3,950건이었다. 파이프라인은 하루 3.4시간 정도만 깨운다.
- Neon 무료 한도 100 CU-시간을 약 3.9일 만에 다 썼다. 0.25 CU 로만 돌았다면 92시간 동안 23 CU-시간이어야 하므로, **평균 1 CU 이상으로 자동 확장된 상태**였던 것으로 본다(또는 전송량 5 GB 초과. 어느 한도인지는 콘솔 확인 필요).
- 당장 추천: **Launch(종량제, 최소 요금 없음)로 전환하고 자동 확장 상한을 0.25~0.5 CU 로 둔다** → 10월 남은 기간 약 $3~8. 11월 1일 초기화를 기다리면 12일 동안 빌드·새 글·인물 페이지가 막힌다.
- 이번 주 설계를 바꾸면(§7) DB 가 깨어 있는 시간은 하루 2~4시간, 월 15~30 CU-시간으로 무료 한도 안에 들어온다.
- AI 비용: 하루 $0.31(월 약 13,800원). 10만 원 상한까지 약 7개월 남았다. 문제없음.

## 1. Neon 무료 요금제 (공식 문서, 2026-10-19 조회)

| 항목 | 무료 | 근거 |
|---|---|---|
| 컴퓨트 | 프로젝트당 월 100 CU-시간(0.25 CU 기준 400시간) | neon.com/docs/introduction/plans |
| 자동 확장 | 최대 2 CU(8 GB RAM) | 같은 곳 |
| 자동 일시정지 | 5분 동안 활동이 없으면 정지, 끌 수 없음. 다음 쿼리가 오면 수백 ms 안에 깸 | /docs/introduction/scale-to-zero |
| 저장 용량 | 프로젝트당 1 GB(계정 합계 20 GB). 넘으면 쓰기 실패 | /faqs/free-plan-limits-and-quotas |
| 전송량(egress) | 프로젝트당 월 5 GB | 같은 곳 |
| 브랜치 | 프로젝트당 10개 | 같은 곳 |
| **한도 초과 시** | 컴퓨트·전송량을 다 쓰면 "다음 결제 주기 또는 업그레이드까지 정지". 기존 연결은 끊기고 새 연결은 거부된다. 데이터는 지우지 않음 | 같은 곳 |
| 초기화 날짜 | 문서에는 "월 결제 주기 시작"이라고만 있다. 매월 1일이면 **2026-11-01 09:00 KST**(추정, 콘솔 Billing 에서 확인) | — |
| 유료 최소 | Launch: **월 최소 요금 없음**, 컴퓨트 $0.106/CU-시간, 저장 $0.35/GB-월, 전송 500 GB 포함. 자동 확장 최대 16 CU, 일시정지를 끌 수 있음(끄지 말 것) | /docs/introduction/plans |
| Vercel 연동 | 청구는 Vercel 인보이스로 온다. 요금제는 Vercel → Storage → Settings → Change Configuration 에서 바꾼다. **같은 연동에 묶인 DB 전체에 적용** | /docs/guides/vercel-managed-integration |

## 2. 오늘 무슨 일이 있었나 (측정)

| 시각 | 사실 | 근거 |
|---|---|---|
| 10-15 22:21 | Neon 연결, 로컬 DB pg_dump 이전 | 커밋 `616004e`, `docs/deploy.md` |
| 10-19 18:33 | 마지막으로 파이프라인 성공(누적 AI 비용 $2.8838) | run 39230664730 |
| 10-19 **18:45** | Vercel 에서 처음 `53000 … exceeded the quota` 발생 | runtime logs `09:45:31Z /zh-tw/news/seoul-alleys-…` |
| 10-19 19:24 | 파이프라인 `prisma migrate deploy` 가 P1001 로 실패. 이후 매 실행 실패 | run 39237135257 |
| 10-19 22:00~23:00 | 오류 로그 19,744줄. 렌더 1회에 약 5줄이므로 **실패 렌더 약 3,950건/시간** | runtime logs group_by level, 17초 표본 100줄 = 요청 20건 |
| 지금 | 캐시가 있는 쪽은 STALE 로 나가지만, 캐시가 없는 인물 페이지는 **500** | `curl /ko/idol/apink` → 500 |
| 미리보기 빌드 | `/en/c/kent` 프리렌더 중 `listActiveCategories` 에서 53000 으로 실패 | `dpl_iYd9XG…` 빌드 로그(빌드는 iad1 에서 돈다) |

## 3. DB 를 깨우는 경로와 하루 깨어 있는 시간

| 경로 | 코드 | 빈도·측정 | 깨어 있는 시간/일 |
|---|---|---|---|
| 파이프라인(이어 달리기 + 3시간마다 지킴이) | `.github/workflows/pipeline.yml` | 하루 28회(10-18 UTC 실측). 보통 실행에서 DB 를 쓰는 구간(migrate~cost)은 1분 44초~2분 30초, 그 뒤 일시정지까지 5분 | 약 3.3시간 |
| 매일 05시 작업 | recheck 2분, products 17초, wiki-sync 7분 4초, rankings 45초 | run 39162156607 | +0.2시간 |
| 발행 직후 재생성 | `apps/worker/src/pipeline/announce.ts:20` | 글 1편마다 17개 경로(사이트맵·언어 홈·피드·카테고리) | 파이프라인 시간과 겹침 |
| **봇 → ISR 재생성** | `revalidate` 300(홈·카테고리·글·md), 3600(나머지 1,640쪽), 600(피드) | 운영 사이트맵 2,768개(글 1,337·인물 1,134). 모든 렌더가 레이아웃의 `listActiveCategories` groupBy 를 부른다(`components/SiteFooter.tsx:23`, `AppHeader.tsx:29`, `CategoryRail.tsx:13`, React `cache` 라 요청 하나 안에서만 공유) | **24시간(끊기지 않음)** |
| 글 조회 | `ViewPing` → `POST /api/views`(UPDATE, `app/api/views/[id]/route.ts:7`), `GET /api/comments`(no-store) | 30일 PV 129(사람) | 지금은 작음. 방문이 띄엄띄엄 오면 1건마다 5분씩 깨움 |
| 투표·반응·응원·댓글 쓰기 | `/api/items/*/vote`, `/api/polls`, `/api/reactions`, `/api/cheer` | 드묾 | 작음 |
| 빌드 프리렌더 | 1,836개 경로(로컬 `.next/prerender-manifest.json`). 가이드 1,640쪽도 DB 를 조회한다(`beauty/data.ts:15`, `drama/[slug]/page.tsx:91`, `clinic/[slug]/page.tsx:101`, 레이아웃 카테고리) | 배포 1회마다. iad1 에서 싱가포르 DB 로 조회 | 배포 수에 비례 |

연결: 웹은 `PrismaPg` 풀 + Neon 풀러 주소(`packages/db/src/index.ts`, 빌드 때만 작업자당 4개), 파이프라인은 unpooled 주소. 쉬는 연결이 일시정지를 막는지는 문서에 없다. 콘솔 연결 수 그래프로 확인해야 한다.

## 4. Vercel 사용량

| 항목 | 측정·추정 | 근거 |
|---|---|---|
| 요금제·청구 | MCP 로는 확인할 수 없었다(`list_billing_charges` → "Plan not found"). 로그가 10-17 까지 남아 있어 Hobby(1시간 보존)는 아닌 것으로 본다 | MCP 응답 |
| 함수 호출 | 한도 초과 뒤 실패 렌더 약 3,950건/시간(약 9.5만 건/일). 정상일 때도 봇 방문이 오래된 페이지에 닿으면 그때마다 재생성한다 | 위 로그 |
| ISR 쓰기 | sin1 기준 $5.20/100만 단위(8 KB). 내용이 같으면 쓰기 0. 그런데 피드 카드에 서버에서 계산한 `timeAgo` 가 들어가(`lib/feed.ts:45`) 재생성할 때마다 내용이 바뀐다. 홈 gzip 38 KB + RSC 22 KB 이므로 1회에 약 8단위 | vercel.com/docs/incremental-static-regeneration/limits-and-pricing |
| 활성 CPU·메모리 | sin1 기준 $0.16/시간, $0.0133/GB-시간 | /docs/pricing/regional-pricing/sin1 |
| 빌드 | 운영 빌드 91초(`dpl_3KqZ…`, 가이드 추가 전). 4코어 Standard 머신은 on-demand 동시 빌드를 켜지 않았으면 과금하지 않는다 | /docs/pricing |
| 이미지 최적화 | 사용 안 함(위키미디어 썸네일 커스텀 로더 `lib/image.ts`) → 0원 | — |
| **옛 프로젝트** | `nextneonews`·`nextneonews-v1` 둘 다 같은 저장소의 **모든 커밋**(dev 포함)을 빌드한다. `prisma/schema.prisma: file not found` 로 약 25초 만에 실패. 푸시 1번에 쓸모없는 빌드가 2개 생긴다 | `dpl_ELHeN8…`, `dpl_4NkzFz…` |

## 5. Claude API

| 항목 | 값 | 근거 |
|---|---|---|
| 모델 | 작성 `claude-haiku-5-5`(동기), 번역 Haiku 5.5 **배치(50% 할인)**, GEO 측정 Sonnet 5.5 + 웹 검색(수동) | `apps/worker/src/ai/models.ts`, `pipeline/translate.ts:137` |
| 단가 | Haiku 5.5 입력 $0.10·출력 $0.50/MTok(10만 토큰까지), Sonnet 5.5 $2·$10 | claude-api 스킬 모델 표, 코드와 같음 |
| 호출당 | 작성 1편 평균 $0.0029, 번역 배치 4건 $0.0018 | 로컬 CostLog, run 로그 |
| 하루 | 10-17 18:57 $2.2763 → 10-19 18:33 $2.8838 → **$0.31/일 ≈ 월 13,800원** | run 로그 `INFO AI cost` |
| 상한 | 사용 $2.88 / 한도 $66.67(10만 원). 지금 속도면 약 7개월 남음 | `ai/budget.ts` |
| 캐시 | system 프롬프트에 `cache_control`. Haiku 5.5 의 최소 캐시 길이는 512토큰이고, 한 실행 안에서 3편을 연달아 쓰므로 캐시가 맞는다 | `ai/client.ts:48` |
| 더 아낄 곳 | 작성도 배치로 돌리면 약 $3.5/월(5천 원) 절감. 대신 발행이 한 실행만큼 늦어진다. 우선순위 낮음 | — |

## 6. 그 밖의 유료 위험

| 항목 | 상태 | 위험 |
|---|---|---|
| GitHub Actions | 공개 저장소라 0원 | `next` 잡이 `sleep 3000` 으로 러너를 50분씩 잡는다. **비공개로 바꾸면** 약 28회×53분 = 월 약 44,000분으로 무료 2,000분을 넘는다 |
| 매일 작업 중복 | 이어 달리기 주기가 53분이라 UTC 20시에 시작이 두 번 걸릴 수 있다 → wiki-sync 7분 등이 두 번 돈다 | 낮음 |
| PostHog·GA4·이메일 | 사람 PV 가 월 129라 무료 구간과 거리가 멀다. 이메일 발송 서비스는 코드에 없다 | 낮음 |
| Neon 저장 | 로컬 58 MB(가장 큰 EntityMetric 42 MB, 하루 약 0.45 MB 증가) | 1 GB 까지 1년 이상 여유 |

## 7. 무료 한도 안에서 도는 설계 — 변경 목록

기준: 지금은 하루 24시간 깨어 있고 평균 약 1 CU 를 쓴다(월 약 700 CU-시간, Launch 로 계산하면 약 $74). 목표는 하루 2~4시간, 0.25 CU, 월 15~30 CU-시간이다.

| # | 변경 | 파일 | 예상 절감 | 공수 | 위험 |
|---|---|---|---|---|---|
| A | Neon 자동 확장 상한을 **0.25(최대 0.5) CU** 로 | Neon 콘솔 → Branch main → Compute → Edit | CU-시간 최대 1/4. 24시간 깨어 있어도 월 180 CU-시간(약 $19) | S(5분) | 빌드·몰릴 때 느려짐 |
| B | 글·홈·카테고리·피드의 `revalidate` 를 **false(또는 86400)** 로 두고 발행 때 on-demand 만 쓴다(이미 `announce.ts`). **무효화한 직후 파이프라인이 그 경로를 한 번씩 미리 요청**해 재생성이 파이프라인이 깨어 있는 시간 안에 끝나게 한다 | `news/[slug]/page.tsx:54`, `[locale]/page.tsx:28`, `c/[category]/*`, `feed.xml`, `announce.ts` | 봇 재생성을 없애 하루 약 20시간 → 월 약 600시간·150~600 CU-시간(Launch 로 $16~64). Vercel 함수·ISR 쓰기도 함께 줄어든다 | M | 댓글 수·인기 글 숫자가 다음 발행까지 묵는다 |
| C | 레이아웃 공통 조회(`listActiveCategories`)와 랭킹 조회를 **요청을 넘어 공유하는 캐시**(`'use cache'`/`unstable_cache` + 태그, 하루 수명, `/api/revalidate` 에서 태그 무효화)로 바꾼다 | `lib/articles.ts:155`, `lib/rankings.ts` | 렌더 1회당 쿼리 1~3개 감소 | S | 카테고리 변경이 하루까지 늦을 수 있음(태그 무효화로 해결) |
| D | 가이드 1,640쪽을 **DB 없는 정적**으로: `revalidate=false`, 투표 집계는 클라이언트 `/api/items`(CDN 5분)로, 프리렌더는 en·ja·zh-TW 만 하고 나머지 6개 언어는 요청 때 만든다 | `beauty/data.ts`, `drama/*`, `clinic/[slug]`, `travel/place/[slug]`, `generateStaticParams` 들 | 빌드 경로 1,836 → 약 700, 빌드 중 DB 조회 1,640 → 0. **DB 가 죽어도 빌드가 된다** | M | 숫자의 SEO 노출이 줄어든다(지금도 30표 전엔 '에디터 픽') |
| E | 인물 페이지: 색인 대상 상위 N 명만 `generateStaticParams`, 그 밖은 `dynamicParams=false` 또는 `revalidate` 1일 | `idol/[slug]/page.tsx:48-53` | 봇이 아무 인물이나 열 때 DB 를 깨우지 않음(가능한 주소 378×9) | S | 색인 안 하는 인물은 404 |
| F | `/api/views` 를 없애고 인기 글은 PostHog 조회 수를 하루 1번 파이프라인이 가져와 계산. `GET /api/comments` 는 `s-maxage=60` + 글쓰기 뒤 무효화, 또는 '댓글 보기'를 눌러야 불러오기 | `api/views/[id]/route.ts`, `ViewPing.tsx:37`, `api/comments/route.ts:8` | 띄엄띄엄 오는 방문 100건/일 기준 최대 약 8시간/일 깨움 방지(성장할수록 커짐) | S~M | 인기 순위가 하루 늦어짐 |
| G | 파이프라인 **2시간 간격**(limit 6 이면 글 수는 같음). `migrate` 는 `migrations/` 가 바뀐 때만. 3시간 지킴이는 실행하지 않고 이어 달리기만 다시 건다 | `pipeline.yml` | 28회 → 12회/일: 월 약 57시간·14 CU-시간 | S | 새 글이 최대 2시간 늦어짐 |
| H | 서버 HTML 의 상대 시각(`timeAgo`)을 절대 날짜로 바꾸고 상대 표시는 클라이언트에서 | `lib/feed.ts:45` | 내용이 같으면 ISR 쓰기 0 → 재생성 1회당 약 8단위 절감 | S | 없음 |
| I | 옛 Vercel 프로젝트 `nextneonews`·`nextneonews-v1` 의 Git 연결 끊기(또는 삭제) | Vercel 설정 | 푸시마다 실패 빌드 2개, 빌드 큐 점유 제거 | S(5분) | 없음 |
| J | 매일·매주 작업을 날짜 키로 하루 1번만 실행 | `pipeline.yml` 시각 확인 | 중복 wiki-sync 7분 제거 | S | 없음 |

A~G 를 적용한 뒤 예상: 파이프라인 1.5시간 + 배포 직후 + 사람이 쓰는 요청 → **하루 2~4시간, 0.25 CU 로 월 15~30 CU-시간(무료의 15~30%)**. 전송량도 재생성 횟수에 비례해 줄어든다.

## 8. 당장 운영 DB 를 살리는 선택지

| 선택지 | 비용 | 복구 | 위험 |
|---|---|---|---|
| **① Launch 전환 + 상한 0.25~0.5 CU (추천)** | 10월 남은 약 302시간 동안: 지금 구조 그대로 0.25 CU 면 약 75 CU-시간 = **$8**. B·D 를 22일까지 적용하면 약 **$3**. 상한 없이 두면 약 $32. 저장 비용 몇 센트 | 즉시 | 상한을 두지 않으면 최대 16 CU 까지 올라간다. 같은 Vercel-Neon 연동의 다른 DB(breeder-web 이 같이 쓰는지 확인)도 요금제가 바뀐다 |
| ② 초기화 대기 | 0원 | 약 11월 1일(추정) | 12일 동안 새 글 없음, **내일 배포 빌드 실패**(프리렌더가 DB 조회), 인물·새 페이지 500, 투표·댓글 실패 |
| ③ Supabase 무료(싱가포르)로 이전 | 0원/월. 컴퓨트 시간 한도는 없고 500 MB, 전송 5 GB | 2~4시간 작업. **Neon 이 정지돼 있어 pg_dump 를 할 수 없으므로 어차피 ①을 잠깐 거쳐야 한다** | 지금 구조라면 전송 5 GB 를 넘을 수 있다 → §7 은 똑같이 해야 한다. 풀러(6543) 연결 시험 필요 |
| ④ 새 Neon 무료 프로젝트 | 0원 | 데이터를 옮길 수 없음(③과 같은 이유) | 구조를 그대로 두면 며칠 안에 같은 일이 생긴다 |

추천 순서: 오늘 ①(Vercel → Storage → neon-violet-book → Change Configuration → Launch, Neon 콘솔에서 max CU 0.5) → 이번 주 A·B·C·D·G·I → 11월 1일에 10-20~31 사용량을 보고 월 80 CU-시간 아래면 Free 로 되돌리고, 아니면 Launch 를 유지한다(예상 $2~3/월).

## 9. 확인하지 못한 것 (대시보드에서 볼 것)

1. Neon 콘솔 Usage: 넘은 한도가 **컴퓨트인지 전송량인지**, 일별 CU-시간, compute 최소/최대 크기, 결제 주기 시작일.
2. Vercel Usage: Function Invocations, Active CPU, ISR Writes(10-15 이후), 팀이 Pro 인지(MCP 청구 API 가 "Plan not found").
3. breeder-web 등 다른 프로젝트가 같은 Neon 연동을 쓰는지(요금제 변경은 연동 전체에 적용된다).

출처: [Neon Plans](https://neon.com/docs/introduction/plans), [Neon Free plan limits](https://neon.com/faqs/free-plan-limits-and-quotas), [Neon Scale to zero](https://neon.com/docs/introduction/scale-to-zero), [Neon Vercel-managed integration](https://neon.com/docs/guides/vercel-managed-integration), [Vercel ISR pricing](https://vercel.com/docs/incremental-static-regeneration/limits-and-pricing), [Vercel sin1 pricing](https://vercel.com/docs/pricing/regional-pricing/sin1), [Vercel Pricing](https://vercel.com/docs/pricing).
