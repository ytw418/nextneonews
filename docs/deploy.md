# 배포

## 구성

| 부분 | 어디 | 비용 |
|---|---|---|
| 웹 (Next.js 16) | **Vercel** 프로젝트 `hallyu-brief` (팀 `holicreacts-projects`), `main` 푸시 시 자동 배포 | Hobby 는 광고 사이트 불가 → 애드센스 붙일 때 **Pro $20/월** (팀이 이미 Pro 면 추가 0원) |
| DB (Postgres 17) | **Neon** `neon-violet-book` (Vercel Marketplace 연동, `DATABASE_URL`·`DATABASE_URL_UNPOOLED` 자동 주입) | 무료 구간 |
| 파이프라인 (수집·작성) | **GitHub Actions** `.github/workflows/pipeline.yml`, 매시 17분, 1회 최대 3편 | 공개 레포라 무료 |
| AI | Anthropic Haiku 5.5, 1편 약 4원 | 최대 하루 72편 기준 월 약 8,600원. 누적 10만 원에서 자동 중단 |
| 도메인 | 지금은 `hallyu-brief.vercel.app`. `hallyubrief.com` 구매 예정 | 연 $11.25 |
| 이미지 | 위키미디어 공용 직접 참조 | 0원 |

## 설정값

- **Vercel 프로젝트**
  - Root Directory: `apps/web`, Node 24.x
  - Build Command: `cd ../.. && touch .env && npm run db:generate && npm run build -w @kmedia/web` (웹 스크립트가 루트 `.env` 를 읽으므로 빈 파일을 만든다. 값은 Vercel 환경변수에서 온다)
  - Install Command: `cd ../.. && npm ci`
  - 환경변수: `DATABASE_URL`(Neon 풀러, 자동), `SITE_URL`, `INDEXNOW_KEY`, `COMMENT_HASH_SECRET`
  - 배포 보호(Vercel 로그인)는 Preview 에만 건다. Production 은 공개.
- **GitHub Secrets**: `DATABASE_URL`(Neon **unpooled** — 마이그레이션용), `ANTHROPIC_API_KEY`, `SITE_URL`, `INDEXNOW_KEY`

## 처음 한 일 (2026-10-15)

- 로컬 DB를 `pg_dump` 로 떠서 Neon 에 그대로 넣었다. 기사 109편·인물 사전·비용 기록이 같이 들어가서 AI 비용이 추가로 들지 않았다.
- 이후 글은 Actions 가 Neon 에 바로 쓴다. 로컬 DB와는 따로 간다.

## 남은 일

1. **도메인**: Vercel 에서 `hallyubrief.com` 구매 → 프로젝트에 연결 → Vercel 환경변수·GitHub Secret 의 `SITE_URL` 을 바꾼다.
2. **검색엔진 등록** (`docs/geo.md` 2장): Search Console(사이트맵 제출), Bing Webmaster Tools.
3. **애드센스**: 가이드형 글 30편 이상 쌓인 뒤 신청. 이때 Vercel Pro 필요.

## 주의

- `.env` 는 커밋하지 않는다. 운영 값은 Vercel·GitHub Secrets 에만 둔다.
- 레포가 공개라 프롬프트·수집 방식도 공개다. 비공개로 바꾸면 Actions 무료 한도가 월 2,000분이므로 cron 을 2시간 간격으로 줄인다.
- 글은 ISR(5분 캐시)이라 발행 뒤 최대 5분 안에 사이트에 보인다.
- 같은 저장소에 연결된 예전 Vercel 프로젝트 `nextneonews` 는 옛 빌드 설정이라 새 커밋마다 빌드가 실패한다. 서비스에는 영향이 없다. 필요 없으면 그 프로젝트의 Git 연결을 끊는다.
