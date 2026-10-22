# 03. 개발

## 구조 (npm workspaces, Node 22+, 루트 패키지명 `kmedia`)

| 경로 | 역할 |
|---|---|
| `apps/web` (`@kmedia/web`) | Next.js 16 + next-intl 사이트. 9개 언어, 뉴스·가이드·랭킹·투표·저장함. **Next 16은 학습 지식과 다르다 — `apps/web/AGENTS.md` 대로 `node_modules/next/dist/docs/` 먼저 볼 것** |
| `apps/worker` (`@kmedia/worker`) | 수집·품질 체크·AI 작성·번역·랭킹·화면 갱신 CLI (`src/cli.ts`) |
| `packages/db` (`@kmedia/db`) | Prisma 7 스키마·마이그레이션·클라이언트(`@prisma/adapter-pg`) |
| `packages/core` (`@kmedia/core`) | 언어·경로·랭킹·일정·댓글 공용 상수와 순수 함수 (`locales.ts` 등) |
| `mobile/` | Expo SDK 58 하이브리드 앱(웹뷰 + 네이티브 탭·저장함·오프라인). 워크스페이스 밖, 자체 lock. 앱 ID `app.unnienote.mobile`. `mobile/AGENTS.md` 참고 |
| `infra/collector-relay` | 서울(`icn1`) Vercel 함수 — 더쿠가 해외 IP를 막을 때 대신 요청. 실제 배포 여부 미확인 |
| `scripts/` | `db-local.sh`, `db-move.sh`, `new-migration.sh`, `smoke.sh`(배포 뒤 확인), `screens.mjs`(아이폰 캡처), `check-error-tracking.mjs`, `vercel-api.sh` |
| `legacy/neonews` | 옛 NeoNews, 참고용 |

`tsconfig.base.json`(strict, `noUncheckedIndexedAccess`)을 각 패키지가 상속. 루트 CLAUDE.md 는 없다.

## 스택

- 웹: Next.js 16, next-intl, zod, react-markdown, budoux. 호스팅 Vercel 프로젝트 `hallyu-brief`(루트 `apps/web`, Node 24.x, 함수 리전 `sin1`).
- DB: Postgres 17. 운영 **Supabase `unnienote-db`(싱가포르)**, 10/20 Neon에서 이전(docs/predeploy/SUPABASE-MIGRATION.md). 웹은 트랜잭션 풀러 6543, Actions 는 세션 풀러 5432. TLS 검증 끄지 않음. **브리디 DB(서울)와 별개 — 건드리지 않는다.**
- AI (`apps/worker/src/ai/models.ts`): 작성·관련성 판정·번역 = `claude-haiku-5-5`, GEO 측정 = `claude-sonnet-5-5`. zh-CN 은 AI 대신 OpenCC. 비용은 `CostLog` 에 쌓이고 `LLM_BUDGET_KRW`(운영 10만 원)에서 AI 호출이 막힌다. 10/21 누적 $2.88.
- 외부: 위키데이터(인물), 위키미디어 공용(CC 사진), 위키백과 조회수, Open Beauty Facts, IndexNow, GA4, 애드센스, 쿠팡 파트너스, 제휴 7곳(올리브영·YesStyle·Amazon·Klook·Creatrip·Trip·Airalo), PostHog.

## 콘텐츠 파이프라인

수집 → 품질 체크(AI 없음) → **관련성 판정(AI)** → 사실 수집 → 작성(AI, 1회 호출로 en·ja·zh-TW·ko) → 자동 검사 → 번역(vi·id·fr·ru 배치) → zh-CN 변환 → 발행 → IndexNow 통지 → 화면 갱신. (docs/production.md)

- **수집** `worker -- collect` → `Signal` 표. 소스: 구글 트렌드·연합뉴스 RSS·더쿠, **10/22 추가 OSEN·엑스포츠뉴스, 케이아지트 제목(화제 신호)**. 네이버 연예 랭킹·네이트판은 robots.txt 때문에 차단(`collectors/policy.ts`). 더쿠 403 → 20초 뒤 재시도 → 릴레이 → 실패 시 건너뜀.
- **품질 체크** `worker -- check`: 중복·위험 주제·도배 필터 + 위키데이터 인지도·키워드 사전 채점(`apps/worker/src/pipeline/heuristics.ts`). 기준 14점. 아이돌·배우·드라마·화장품·맛집 우대, 전쟁·정치·경제·죽음·중년 남자 배우/가수 제외(10/22 abb95da). 케이아지트 제목만 있는 주제는 감점(33eae00).
- **관련성 판정**: 작성 직전 `gate` 모델이 무관 기사를 막고 분류를 고친다. 한글 섞임 검사 포함. 이미 나간 무관 기사는 `unpublish --off-topic`, 재판정은 `regate`.
- **작성** `worker -- write N`: 프롬프트 `apps/worker/src/ai/prompts.ts`. 원문 문장은 저장하지 않고 사실만 `Article.facts` 에.
- **발행**: 운영은 `AUTO_PUBLISH=true`. `seed-topic` 으로 넣은 주제는 점수와 상관없이 대기열 맨 앞.

### 스케줄 (`.github/workflows/pipeline.yml`)
- cron `17 */2 * * *` (2시간마다, KST 홀수 시 17분). 매회 `pipeline N`(기본 7편) → `zh-cn` → `translate` → `cost` → 화면 갱신.
- 하루 작업(KST 05시 이후 첫 실행): `recheck`, `products`, `wiki-sync`, `rankings`. 주 작업(월요일): `entities`, `entity-meta`, `weekly-poll`, 주간 랭킹. 날짜 키는 Actions 캐시 `marks-*`.
- 마이그레이션은 migrations 폴더가 바뀐 뒤 한 번(다시 돌리려면 캐시 `migrated-*` 삭제).
- 운영 배포 완료(`deployment_status`) 시 `refresh deploy` 로 화면 미리 그림. `REVALIDATE_SECRET` 없으면 새 글이 화면에 안 나온다.
- `maintenance.yml`(수동): `unpublish --off-topic [--dry]`, `cost`, `fix-script [--dry]`, `regate [--dry]`, `seed-topic`, `entities`, `rankings`, `refresh day`.
- 캐시: 화면 대부분을 시간 경과로 재생성하지 않고 파이프라인 직후에만 다시 그린다(봇이 ISR 을 깨워 Neon 무료 한도를 3.9일 만에 다 쓴 경험, docs/predeploy/cost.md).

## 명령

```bash
npm install && cp .env.example .env
npm run db:start && npm run db:migrate && npm run db:generate && npm run db:seed
npm run dev                                   # http://localhost:3000/en
npm run typecheck && npm run lint && npm test # vitest (순수 함수만)
npm run check-catalog -w @kmedia/web
npm run build                                 # DB 켜져 있어야 함
npm run worker -- <collect|check|write 3|pipeline 3|review|publish|cost|geo-check 8>
npm run db:migrate:new -- <이름>              # 스키마 변경: schema.prisma → 이것 → db:migrate → db:generate
sh scripts/smoke.sh [URL]                     # 배포 뒤 확인
gh workflow run pipeline
gh workflow run maintenance -f command="unpublish --off-topic --dry"
```
Prisma 개발 모드 자동 마이그레이션은 DB를 초기화할 수 있어 쓰지 않는다.

## 배포

- **`main` 푸시 = 운영 배포.** 10/22부터 기능은 PR(#1~#5)로 올리고 머지하는 흐름. 되돌리기는 Vercel Deployments 에서 이전 배포 Promote.
- 배포 전: typecheck·lint·test·check-catalog·build + 아이폰 캡처(en·ja·zh-TW). 배포 뒤: `smoke.sh`, 새 경로 200, 색인 언어 밖 경로(`/ko/beauty` 등) `X-Robots-Tag: noindex, follow`, 투표 뒤 새로고침, Supabase 사용량. (docs/predeploy/DEPLOY-CHECKLIST.md)
- 앱: EAS `@ytw418/unnienote`, 프로필 development·preview·production(autoIncrement). Android EAS 무료 빌드 한도가 소진돼 AAB(versionCode 6)는 로컬 빌드. 스토어 제출은 브리디 앱 자동화를 재사용.

## 환경변수 (이름만 — 값은 Vercel·GitHub Secrets 에만)

- 핵심: `DATABASE_URL`, `SITE_URL`, `COMMENT_HASH_SECRET`, `NEXT_PUBLIC_CONTACT_EMAIL`
- AI·파이프라인: `ANTHROPIC_API_KEY`, `LLM_BUDGET_KRW`, `AUTO_PUBLISH`, `INDEXNOW_KEY`, `REVALIDATE_SECRET`
- 수집 릴레이: `COLLECTOR_RELAY_URL`, `COLLECTOR_TOKEN`, `THEQOO_FORCE_RELAY`
- 제휴: `AFFILIATE_OLIVEYOUNG|YESSTYLE|AMAZON|KLOOK|CREATRIP|TRIP|AIRALO`
- 광고·분석: `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT_{ARTICLE,GUIDE,HOME_1,HOME_2,CATEGORY}`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_RELAY`, `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`
- 기타: `KPOP_CHART`, `NEXT_PUBLIC_NEXT_ARTICLE`, `FIX_SCRIPT_NAMES` / 앱: `EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_SITE_URL`
- 모든 앱이 루트 `.env` 하나를 읽는다. `.env` 는 커밋 금지(저장소 공개).

## 계측 (PostHog + GA4)

- 초기화 `apps/web/src/instrumentation-client.ts`, **`cookieless_mode: "always"`** → 날마다 새 해시 ID라 **재방문·사람 수는 PostHog 로 못 잰다**(재방문은 GA4 기준). posthog-js·gtag 는 페이지 로드 뒤 지연 로드.
- 이벤트 전송은 `apps/web/src/lib/track.ts` 의 `track()` 한 곳(GA4·PostHog 양쪽, `platform: web|pwa` 자동). 이벤트 이름은 `TrackEvent` 타입에 있다 — 새 이벤트는 여기 추가.
- **내부 트래픽 제외(10/22 ebd8c2b)**: 주소에 `?internal=1` 을 한 번 붙여 열면 그 브라우저(localStorage `un_internal=1`)는 PostHog 를 받지 않는다. `?internal=0` 으로 해제. `/_next/` 404 페이지뷰는 `before_send` 에서 버린다. **팀원은 각자 기기에서 `https://unnienote.app/?internal=1` 을 한 번 열 것.** GA4 쪽 제외는 미확인.
- 에러 추적: `$exception`(브라우저·error.tsx·서버 instrumentation), 탭당 최대 10건. 소스맵은 빌드 때 PostHog 에 직접 업로드.

## 운영 주의사항

- 빌드가 DB를 조회한다(뉴스·홈 프리렌더). DB가 꺼지면 빌드 실패.
- Supabase 무료 한도: 저장 500MB, 전송 5GB/월.
- 저장소가 공개라 Actions 는 무료 무제한. 비공개로 바꾸면 월 2,000분 한도 → cron 간격을 늘려야 함.
- 옛 Vercel 프로젝트 `nextneonews` 가 같은 저장소에 연결돼 커밋마다 빌드 실패(서비스 영향 없음). 필요 없으면 Git 연결 해제.
- 수집 윤리: 유료 주거용 프록시·IP 바꿔 접속·Cloudflare Worker 경유 금지.

### 문서와 코드가 어긋난 곳 (정리 필요)
- `README.md`: 언어 4개로 적힘 → 실제 9개.
- `docs/deploy.md`: "매시 17분, 최대 3편" → 실제 2시간 간격·기본 7편. "Neon 옆" 등 옛 표현.
- PRD·deploy.md 의 Hallyu Brief·`HallyuBriefBot`·hallyubrief.com → Unnie Note.

## 남은 개발 과제

1. **무관 기사 정리**: 검색 유입 상위인 사우디 처형 기사(/fr·/vi·/ja, 이탈 96~100%) 등 관련성 판정 이전 발행분을 `regate --dry` → `unpublish --off-topic` 으로 정리.
2. **PR #3 리뷰·머지**(YesStyle ja 우선).
3. **제휴 승인 반영**: 링크 받으면 Vercel env `AFFILIATE_*` 넣고 재배포. 아마존 태그는 `/disclosure` Associates 문장 배포 뒤.
4. **애드센스**: Vercel Pro 전환 → 신청 → 승인 뒤 슬롯 env.
5. **REVIEW-LEFT 구조·성능**: 광고 띠·지역표·제휴 고지 컴포넌트 통합, 레이아웃이 i18n 네임스페이스 6개를 모든 HTML에 싣는 문제, 피부 타입 OG 정적 생성. 클리닉 응답(`kind === "clinic"`)이 분석으로 안 나가는지 확인.
6. **앱 2단계**(docs/decisions/app-2026-10-21.md §10): 푸시 등록(APNs·`PushDevice`), 컴백 D-1 발송, 유니버설 링크(AASA·assetlinks), 설정 화면, App Store Connect·TestFlight, Android 광고(react-native-google-mobile-ads 17.3+), EU DSA 거래자 정보. Play 개인 계정은 테스터 12명 × 14일 조건.
7. **PR 검사 CI 없음**: 확인된 워크플로우는 `pipeline.yml`·`maintenance.yml` 뿐 — typecheck·lint·test 를 PR 에서 돌리는 워크플로우 추가 권장.
8. 문서 정리(위 '어긋난 곳').
9. 미확인: `infra/collector-relay`(`hallyu-collector`) 배포 여부, 숏폼(Remotion)·X 수집 구현 여부(docs/production.md 에 설계만).
