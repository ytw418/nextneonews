#!/bin/sh
# 운영 DB 를 다른 Postgres 로 통째로 옮긴다 (Neon → Supabase 등). 스키마·데이터·시퀀스 전부.
# 사용: SRC_URL='<옛 DB, unpooled/direct>' DST_URL='<새 DB, 세션 풀러 5432 또는 direct>' sh scripts/db-move.sh
#   - 옛 DB 는 깨어 있어야 한다 (Neon 이 한도 초과로 멈춰 있으면 pg_dump 가 연결하지 못한다)
#   - 새 DB 는 비어 있어야 한다. 기존 테이블이 있으면 멈춘다 (덮어쓰지 않는다)
#   - 덤프 파일은 .local/db-move/ 에 남는다 (되돌릴 때 쓴다)
set -eu

: "${SRC_URL:?SRC_URL 이 필요하다 (옛 DB 주소)}"
: "${DST_URL:?DST_URL 이 필요하다 (새 DB 주소)}"

PG_BIN="$(ls -d /opt/homebrew/opt/postgresql@17/bin 2>/dev/null || true)"
PG_DUMP="${PG_BIN:+$PG_BIN/}pg_dump"
PG_RESTORE="${PG_BIN:+$PG_BIN/}pg_restore"
PSQL="${PG_BIN:+$PG_BIN/}psql"

OUT=".local/db-move"
mkdir -p "$OUT"
DUMP="$OUT/kmedia-$(date +%Y%m%d-%H%M%S).dump"

echo "1) 새 DB 가 비어 있는지 확인"
existing=$("$PSQL" "$DST_URL" -Atc "select count(*) from information_schema.tables where table_schema='public'")
if [ "$existing" != "0" ]; then
  echo "새 DB public 스키마에 테이블이 $existing 개 있다. 비우고 다시 실행한다" >&2
  exit 1
fi

echo "2) 옛 DB 덤프 → $DUMP"
"$PG_DUMP" "$SRC_URL" --format=custom --no-owner --no-privileges --schema=public --file="$DUMP"

echo "3) 새 DB 로 복원"
"$PG_RESTORE" --dbname="$DST_URL" --no-owner --no-privileges --schema=public --exit-on-error "$DUMP"

echo "4) 행 수 비교 (주요 테이블)"
for t in Article Translation Entity CostLog Comment ItemVote _prisma_migrations; do
  a=$("$PSQL" "$SRC_URL" -Atc "select count(*) from \"$t\"" 2>/dev/null || echo "-")
  b=$("$PSQL" "$DST_URL" -Atc "select count(*) from \"$t\"" 2>/dev/null || echo "-")
  echo "  $t: 옛 $a / 새 $b"
done
echo "끝. 다음: GitHub Secrets·Vercel 의 DATABASE_URL 을 새 주소로 바꾸고 재배포 (docs/predeploy/SUPABASE-MIGRATION.md)"
