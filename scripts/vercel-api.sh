#!/bin/sh
# Vercel API 를 운영 프로젝트(hallyu-brief)에 바로 보낸다. 화면이 잠겨 있어도 된다 (사용자 크롬·Vercel MCP 가 안 될 때).
# 토큰은 이 맥의 Vercel CLI 로그인(holicreact)을 쓰고, 만료됐으면 CLI 가 refresh token 으로 갱신한다.
#
#   sh scripts/vercel-api.sh env-set KEY VALUE [encrypted|plain]   운영 환경변수 넣기·바꾸기 (값은 출력하지 않는다)
#   sh scripts/vercel-api.sh deploys                                 최근 운영 배포 3개 (커밋·상태)
#   sh scripts/vercel-api.sh GET|PUT|POST|PATCH /v1/... [json파일]   그 밖의 API (projectId·teamId 는 자동으로 붙인다)
set -eu
PROJECT=prj_PYTYRb8LwzL5JhGypO1mGh99BSyo
TEAM=team_BzeZkq3AK4xznSh7vxovu57y
AUTH="$HOME/Library/Application Support/com.vercel.cli/auth.json"

token() { python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['token'])" "$AUTH"; }
T=$(token)
if [ "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $T" https://api.vercel.com/v2/user)" != 200 ]; then
  (cd /tmp && npx -y vercel@latest whoami >/dev/null 2>&1) || { echo "Vercel CLI 로그인이 풀림: npx vercel login" >&2; exit 1; }
  T=$(token)
fi

call() { # method path [body-file]
  sep='?'; case "$2" in *\?*) sep='&';; esac
  url="https://api.vercel.com$2${sep}projectId=$PROJECT&teamId=$TEAM"
  if [ -n "${3:-}" ]; then
    curl -s -w '\nHTTP %{http_code}\n' -X "$1" -H "Authorization: Bearer $T" -H 'Content-Type: application/json' --data @"$3" "$url"
  else
    curl -s -w '\nHTTP %{http_code}\n' -X "$1" -H "Authorization: Bearer $T" "$url"
  fi
}

case "${1:-}" in
  env-set)
    f=$(mktemp); trap 'rm -f "$f"' EXIT
    python3 -c "import json,sys;print(json.dumps({'key':sys.argv[1],'value':sys.argv[2],'type':sys.argv[3],'target':['production']}))" "$2" "$3" "${4:-encrypted}" > "$f"
    curl -s -o /dev/null -w "env $2: HTTP %{http_code}\n" -X POST -H "Authorization: Bearer $T" -H 'Content-Type: application/json' --data @"$f" \
      "https://api.vercel.com/v10/projects/$PROJECT/env?teamId=$TEAM&upsert=true"
    echo "새 값은 다음 배포부터 들어간다" ;;
  deploys)
    curl -s -H "Authorization: Bearer $T" "https://api.vercel.com/v6/deployments?projectId=$PROJECT&teamId=$TEAM&target=production&limit=3" |
      python3 -c "import json,sys
for d in json.load(sys.stdin)['deployments']: print(d['meta'].get('githubCommitSha','')[:7], d['state'], d['url'])" ;;
  GET|PUT|POST|PATCH|DELETE) call "$1" "$2" "${3:-}" ;;
  *) sed -n 2,8p "$0"; exit 1 ;;
esac
