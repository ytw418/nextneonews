#!/bin/sh
# 로컬 개발용 Postgres. Homebrew postgresql 바이너리를 쓰고 데이터는 레포의 .local/pg 에 둔다.
# 시스템 서비스(brew services)는 건드리지 않는다.
set -e
# macOS 에서 로케일이 비어 있으면 "postmaster became multithreaded during startup" 으로 죽는다.
export LC_ALL="${LC_ALL:-C}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$ROOT/.local/pg"
PORT="${LOCAL_PG_PORT:-54329}"
DB="kmedia"
PG_OPTS="-p $PORT -k $ROOT/.local"

case "$1" in
  start)
    if [ ! -d "$DATA" ]; then
      mkdir -p "$ROOT/.local"
      initdb -D "$DATA" -U postgres --auth=trust --encoding=UTF8 --locale=C >/dev/null
    fi
    if ! pg_ctl -D "$DATA" status >/dev/null 2>&1; then
      pg_ctl -D "$DATA" -o "$PG_OPTS" -l "$ROOT/.local/pg.log" -w start >/dev/null
    fi
    if ! psql -h localhost -p "$PORT" -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB'" | grep -q 1; then
      createdb -h localhost -p "$PORT" -U postgres "$DB"
    fi
    echo "postgres running: postgresql://postgres@localhost:$PORT/$DB"
    ;;
  stop)
    pg_ctl -D "$DATA" stop
    ;;
  *)
    echo "usage: sh scripts/db-local.sh start|stop" >&2
    exit 1
    ;;
esac
