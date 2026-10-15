#!/bin/sh
# 새 마이그레이션 SQL 만들기 (packages/db 에서 실행된다).
# 로컬 DB(기존 마이그레이션이 모두 적용된 상태)와 schema.prisma 의 차이를 SQL 파일로 뽑는다.
# 차이 계산은 읽기 전용이다. 만든 SQL 을 확인한 뒤 `npm run db:migrate` (migrate deploy) 로 적용한다.
set -e
NAME="$1"
if [ -z "$NAME" ]; then
  echo "usage: npm run db:migrate:new -- <name>" >&2
  exit 1
fi

mkdir -p prisma/migrations
[ -f prisma/migrations/migration_lock.toml ] || printf 'provider = "postgresql"\n' > prisma/migrations/migration_lock.toml

npx prisma migrate deploy

DIR="prisma/migrations/$(date -u +%Y%m%d%H%M%S)_$NAME"
mkdir -p "$DIR"
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script -o "$DIR/migration.sql"

if ! grep -qv -e '^--' -e '^[[:space:]]*$' "$DIR/migration.sql"; then
  rm -rf "$DIR"
  echo "schema 변경 없음"
  exit 0
fi
echo "created $DIR/migration.sql — 내용 확인 후 npm run db:migrate"
