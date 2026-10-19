# 배포

## 구성

| 부분 | 어디 | 비용 |
|---|---|---|
| 웹 (Next.js 16) | **Vercel** 프로젝트 `hallyu-brief` (팀 `holicreacts-projects`), `main` 푸시 시 자동 배포 | Hobby 는 광고 사이트 불가 → 애드센스 붙일 때 **Pro $20/월** (팀이 이미 Pro 면 추가 0원) |
| DB (Postgres 17) | **Neon** `neon-violet-book` (Vercel Marketplace 연동, `DATABASE_URL`·`DATABASE_URL_UNPOOLED` 자동 주입) | 무료 구간 |
| 파이프라인 (수집·작성) | **GitHub Actions** `.github/workflows/pipeline.yml`, 매시 17분, 1회 최대 3편 | 공개 레포라 무료 |
| 서울 수집 릴레이 | **Vercel** 프로젝트 `hallyu-collector` (같은 레포, `infra/collector-relay`, 리전 `icn1`). 더쿠가 해외 IP 를 403 으로 막을 때만 쓴다 | Hobby 무료 |
| AI | Anthropic Haiku 5.5, 1편 약 4원 | 최대 하루 72편 기준 월 약 8,600원. 누적 10만 원에서 자동 중단 |
| 도메인 | 지금은 `hallyu-brief.vercel.app`. `unnienote.com` 구매 예정 | 연 $11.25 |
| 이미지 | 위키미디어 공용 직접 참조 | 0원 |

## 설정값

- **Vercel 프로젝트**
  - Root Directory: `apps/web`, Node 24.x, 함수 리전 `sin1` (Neon 과 같은 싱가포르. 일본·대만에도 가깝다)
  - Build Command: `cd ../.. && touch .env && npm run db:generate && npm run build -w @kmedia/web` (웹 스크립트가 루트 `.env` 를 읽으므로 빈 파일을 만든다. 값은 Vercel 환경변수에서 온다)
  - Install Command: `cd ../.. && npm ci`
  - 환경변수: `DATABASE_URL`(Neon 풀러, 자동), `SITE_URL`, `INDEXNOW_KEY`, `COMMENT_HASH_SECRET`
  - 배포 보호(Vercel 로그인)는 Preview 에만 건다. Production 은 공개.
- **GitHub Secrets**: `DATABASE_URL`(Neon **unpooled** — 마이그레이션용), `ANTHROPIC_API_KEY`, `SITE_URL`, `INDEXNOW_KEY`
  - 선택 (비어 있어도 돈다): `COLLECTOR_RELAY_URL`·`COLLECTOR_TOKEN` (아래 서울 수집 릴레이)

## 서울 수집 릴레이 (`hallyu-collector`)

더쿠는 접속 국가로 막는다 (한국·일본·미국 200, 유럽·싱가포르 등 403). Actions 러너가 막힌 나라 IP 를 받으면 워커는 20초 뒤 한 번 더 요청하고, 그래도 403·429·503 이면 이 릴레이(서울 icn1 Vercel 함수)로 같은 요청을 보낸다. 릴레이가 없거나 실패하면 더쿠만 '건너뜀'으로 남기고 파이프라인은 계속 돈다.

- 코드: `infra/collector-relay/api/fetch.mjs` (의존성 없음, npm 워크스페이스 밖이라 `package-lock.json` 과 무관)
  - `POST /api/fetch` `{method, url, body}` → `{status, contentType, body, region}`. 캐시하지 않는다
  - `Authorization: Bearer COLLECTOR_TOKEN` 이 틀리면 401, 허용 목록 밖이면 403. 허용 목록은 더쿠 `hot·square·dyb·yn` 목록 GET 과 댓글 목록 POST(`act=dispTheqooContentCommentListTheqoo`) 뿐이다
  - robots.txt·약관 확인은 워커(`apps/worker/src/collectors/http.ts`)가 요청 전에 한다. 릴레이도 같은 봇 UA 로 보낸다
- 만들기 (한 번만)
  1. Vercel → Add New → Project → 같은 GitHub 레포를 고른다. 이름 `hallyu-collector`
  2. Root Directory: `infra/collector-relay`, Framework Preset: Other. Build·Install Command 는 비워 둔다 (package.json 이 없어 설치·빌드가 없다)
  3. 리전은 `vercel.json` 의 `icn1` 이 정한다. Hobby 는 프로젝트당 리전 하나라 본 프로젝트(`sin1`, Neon 옆)와 나눴다
  4. 환경변수: `COLLECTOR_TOKEN` (긴 임의 값, 예: `openssl rand -hex 32`), `SITE_URL` (선택. 봇 UA 의 연락 주소, 비우면 `https://hallyu-brief.vercel.app`)
  5. 배포 보호는 Preview 에만 건다 (Production 주소를 Actions 가 부른다)
  6. (권장) Settings → Git → Ignored Build Step 에 `git diff --quiet HEAD^ HEAD -- .` 를 넣어 릴레이 폴더가 바뀔 때만 다시 배포한다
  7. GitHub Secrets: `COLLECTOR_RELAY_URL` = 배포 주소 (예: `https://hallyu-collector.vercel.app`, `/api/fetch` 는 붙이지 않는다), `COLLECTOR_TOKEN` = 4번과 같은 값
- 확인: 로컬에서 릴레이 경로만 태워 본다. 로그에 `fetch: via relay … "region":"icn1"` 이 찍히면 된다
  ```bash
  THEQOO_FORCE_RELAY=1 COLLECTOR_RELAY_URL=https://hallyu-collector.vercel.app COLLECTOR_TOKEN=… npm run collect -- theqoo
  ```
- 예비 경로: 릴레이(icn1)까지 막히면 사장님 맥(한국 회선)에 GitHub self-hosted runner 를 둔다 (레포 Settings → Actions → Runners → New self-hosted runner → macOS, `./svc.sh install && ./svc.sh start`). 이때는 `pipeline.yml` 의 `runs-on` 을 바꾸는 작업이 따로 필요하다
- 하지 않는 것: 유료 주거용 프록시, IP 를 바꿔 가며 접속하기, Cloudflare Worker 경유 (나가는 국가를 고를 수 없다)

## 처음 한 일 (2026-10-15)

- 로컬 DB를 `pg_dump` 로 떠서 Neon 에 그대로 넣었다. 기사 109편·인물 사전·비용 기록이 같이 들어가서 AI 비용이 추가로 들지 않았다.
- 이후 글은 Actions 가 Neon 에 바로 쓴다. 로컬 DB와는 따로 간다.

## 남은 일

1. **도메인**: Vercel 에서 `unnienote.com` 구매 → 프로젝트에 연결 → Vercel 환경변수·GitHub Secret 의 `SITE_URL` 을 바꾼다.
2. **검색엔진 등록** (`docs/geo.md` 2장): Search Console(사이트맵 제출), Bing Webmaster Tools.
3. **애드센스**: 가이드형 글 30편 이상 쌓인 뒤 신청. 이때 Vercel Pro 필요.
4. **서울 수집 릴레이**: 위 '만들기' 절차로 `hallyu-collector` 를 만들고 GitHub Secrets 두 개를 넣는다. 첫 배포 뒤 '확인' 명령으로 `icn1` 에서 더쿠가 200 인지 본다 (icn1 이 열린다는 것은 아직 시험하지 않은 가설이다).

## 주의

- `.env` 는 커밋하지 않는다. 운영 값은 Vercel·GitHub Secrets 에만 둔다.
- 레포가 공개라 프롬프트·수집 방식도 공개다. 비공개로 바꾸면 Actions 무료 한도가 월 2,000분이므로 cron 을 2시간 간격으로 줄인다.
- 글은 ISR(5분 캐시)이라 발행 뒤 최대 5분 안에 사이트에 보인다.
- 같은 저장소에 연결된 예전 Vercel 프로젝트 `nextneonews` 는 옛 빌드 설정이라 새 커밋마다 빌드가 실패한다. 서비스에는 영향이 없다. 필요 없으면 그 프로젝트의 Git 연결을 끊는다.
