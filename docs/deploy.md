# 배포

## 구성

| 부분 | 어디 | 비용 |
|---|---|---|
| 웹 (Next.js 16) | **Vercel** — 브리디와 같은 팀 `holicreact's projects` | 광고 사이트는 Hobby 불가 → **Pro $20/월** (팀이 이미 Pro 면 추가 0원) |
| DB (Postgres) | **Neon** (Vercel Marketplace 연동, `DATABASE_URL` 자동 주입) 또는 Supabase | 무료 구간으로 시작 |
| 파이프라인 (수집·작성) | **GitHub Actions** `.github/workflows/pipeline.yml`, 매시간 | 공개 레포라 무료 |
| AI | Anthropic Haiku 5.5, 1편 약 4원 | 하루 120편(5편×24회) 기준 월 약 1.4만 원 |
| 도메인 | `hallyubrief.com` (Vercel 에서 구매, 2026-10-14 기준 등록 가능) | 연 $11.25 |
| 이미지 | 위키미디어 공용 직접 참조 | 0원 |

## 순서

1. **DB**: Vercel 프로젝트 → Storage → Neon 연결 (Production 환경에 `DATABASE_URL` 자동 생성).
2. **Vercel 프로젝트**
   - 저장소: `ytw418/nextneonews`, Root Directory: `apps/web`
   - Build Command: `cd ../.. && npm run db:generate && npm run build -w @kmedia/web`
   - Install Command: `cd ../.. && npm ci`
   - 환경변수: `DATABASE_URL`(Neon), `SITE_URL=https://hallyubrief.com`, `INDEXNOW_KEY`, `COMMENT_HASH_SECRET`
3. **마이그레이션**: 첫 배포 전에 한 번 `DATABASE_URL=<neon> npm run db:migrate` (이후엔 Actions 가 매번 `migrate deploy`).
4. **사전·초기 글**: `npm run worker -- entities` → `npm run worker -- history 7` → `check` → `write 100` (Neon 을 가리키게 해서).
5. **GitHub Secrets**: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `SITE_URL`, `INDEXNOW_KEY`.
6. **도메인**: Vercel 에서 `hallyubrief.com` 구매 → 프로젝트에 연결.
7. **검색엔진 등록** (`docs/geo.md` 2장): Search Console(사이트맵 제출, AI 기능 포함 확인), Bing Webmaster Tools(AI Performance), Cloudflare 를 쓰면 AI 봇 차단 해제.
8. **애드센스**: 가이드형 글 30편 이상 쌓인 뒤 신청.

## 주의

- `.env` 는 커밋하지 않는다. 운영 값은 Vercel·GitHub Secrets 에만 둔다.
- 레포가 공개라 프롬프트·수집 방식도 공개다. 비공개로 바꾸면 Actions 무료 한도가 월 2,000분이므로 cron 을 2시간 간격으로 줄인다.
- 글은 ISR(5분 캐시)이라 발행 뒤 최대 5분 안에 사이트에 보인다.
