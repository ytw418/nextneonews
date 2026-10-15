#!/bin/sh
# 배포 뒤 주요 주소가 살아 있는지 확인한다. 사용: sh scripts/smoke.sh [기준 URL]
BASE="${1:-https://hallyu-brief.vercel.app}"
fail=0
for p in / /en /ja /zh-tw /zh-cn /ko /vi /id /fr /ru /en/c/kpop /sitemap.xml /robots.txt /llms.txt /manifest.webmanifest /sw.js "/api/pwa-icon?size=192"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$p")
  case "$code" in 200|307|308) ;; *) fail=1 ;; esac
  printf '%-28s %s\n' "$p" "$code"
done
article=$(curl -s "$BASE/sitemap.xml" | grep -o "<loc>$BASE/en/news/[^<]*" | head -1 | sed 's/<loc>//')
code=$(curl -s -o /dev/null -w '%{http_code}' "$article"); printf '%-28s %s\n' "(first article)" "$code"
[ "$code" = 200 ] || fail=1
exit $fail
