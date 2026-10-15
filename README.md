# Hallyu Brief (가칭)

다국어 K-컬처 이슈 미디어.
- 기획: [`docs/PRD.md`](docs/PRD.md) (v0.3) · 조사: [`docs/research/`](docs/research)
- 매출 예상: [`docs/revenue.md`](docs/revenue.md)
- 키워드: [`docs/keywords.md`](docs/keywords.md)
- 이전 NeoNews 코드는 [`legacy/neonews`](legacy/neonews)에 참고용으로만 남겨 두었다.

## 구조

```
apps/web       Next.js 16 사이트 (next-intl: /en /ja /zh-tw /ko)
apps/worker    수집기 CLI (네이버 엔터 랭킹, 네이트판 → Signal 테이블)
packages/db    Prisma 7 스키마·마이그레이션·클라이언트
packages/core  공용 상수(언어, 사이트명)와 순수 함수
scripts        로컬 Postgres, 마이그레이션 생성 스크립트
```

## 처음 세팅

필요한 것: Node 22 이상, Homebrew `postgresql@17` (`brew install postgresql@17`)

```bash
npm install
cp .env.example .env
npm run db:start      # 로컬 Postgres (.local/pg, 포트 54329). brew services 는 건드리지 않는다
npm run db:migrate    # 마이그레이션 적용 (prisma migrate deploy)
npm run db:generate   # Prisma 클라이언트 생성
npm run db:seed       # 샘플 글 1편 (4개 언어)
npm run dev           # http://localhost:3000/en
```

## 자주 쓰는 명령

| 명령 | 설명 |
|---|---|
| `npm run dev` | 웹 개발 서버 |
| `npm run collect` | 모든 수집기를 실행한다. 하나만 돌리려면 `npm run collect -- pann` |
| `npm run db:migrate:new -- <이름>` | `schema.prisma` 변경분을 SQL 마이그레이션 파일로 만든다 (DB는 바꾸지 않음) |
| `npm run db:migrate` | 마이그레이션 적용 |
| `npm run db:studio` | DB 내용 보기 |
| `npm run db:stop` | 로컬 Postgres 끄기 |
| `npm run typecheck` / `npm run lint` / `npm test` | 검사 |
| `npm run build` | 프로덕션 빌드 (DB가 켜져 있어야 한다) |
| `sh scripts/smoke.sh [URL]` | 배포 뒤 주요 주소 확인 (기본: 운영) |
| `node scripts/screens.mjs [URL] [폴더]` | 아이폰 크기로 주요 화면 캡처 |

## 콘텐츠 파이프라인

`.env`에 `ANTHROPIC_API_KEY`가 있어야 한다. 단계별 기준은 [`docs/production.md`](docs/production.md)에 있다.

```bash
npm run worker -- collect        # 네이버 엔터 랭킹·네이트판 수집 → Signal
npm run worker -- entities       # 위키데이터 인물·그룹·드라마 사전 갱신 (무료, 주 1회)
npm run worker -- check          # 품질 체크: 규칙 필터 + 알고리즘 채점 (AI 없음) → Topic 큐
npm run worker -- write 3        # 큐 상위 3개: Haiku 1회 호출로 en·ja·zh-TW·ko 기사 + 위키미디어 사진 (1편 약 4원)
npm run worker -- images         # 사진 없는 글에 위키미디어 공용 CC 사진 붙이기 (무료)
npm run worker -- pipeline 3     # 위 세 단계 한 번에
npm run worker -- review         # (AUTO_PUBLISH=false 일 때) 승인 대기 글과 검사 경고
npm run worker -- publish [id…]  # (AUTO_PUBLISH=false 일 때) 승인
npm run worker -- cost           # AI 누적 비용 / 상한 (10만 원)
```

- 모델은 `apps/worker/src/ai/models.ts`에서 정한다.
- 프롬프트는 `apps/worker/src/ai/prompts.ts`에 있다.
- 호출 비용은 `CostLog` 테이블에 쌓인다.

## 스키마 바꾸는 순서

1. `packages/db/prisma/schema.prisma`를 고친다.
2. `npm run db:migrate:new -- <이름>`을 실행하고, 생성된 `migration.sql`을 확인한다.
3. `npm run db:migrate`를 실행한 뒤 `npm run db:generate`를 실행한다.

Prisma의 개발 모드 자동 마이그레이션은 쓰지 않는다. 스키마가 어긋나면 DB를 초기화할 수 있기 때문이다.

## 환경변수

모든 앱이 레포 루트의 `.env` 하나를 읽는다. 항목은 `.env.example`을 참고한다.
