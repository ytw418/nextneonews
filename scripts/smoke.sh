#!/bin/sh
# 배포 뒤 주요 주소가 살아 있는지 확인한다. 사용: sh scripts/smoke.sh [기준 URL]
BASE="${1:-https://unnienote.app}"
fail=0
for p in / /en /ja /zh-tw /zh-cn /ko /vi /id /fr /ru /en/c/kpop /sitemap.xml /robots.txt /llms.txt /manifest.webmanifest /sw.js "/api/pwa-icon?size=192" \
  /en/guide /ja/guide /zh-tw/guide /en/beauty /en/beauty/skin-type /en/travel /en/clinic /en/clinic/how-to-choose /en/drama \
  /en/saved /en/partners /en/disclosure /ja/disclosure /zh-tw/disclosure /api/items/clinic/botox; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$p")
  case "$code" in 200|307|308) ;; *) fail=1 ;; esac
  printf '%-28s %s\n' "$p" "$code"
done
article=$(curl -s "$BASE/sitemap.xml" | grep -o "<loc>$BASE/en/news/[^<]*" | head -1 | sed 's/<loc>//')
code=$(curl -s -o /dev/null -w '%{http_code}' "$article"); printf '%-28s %s\n' "(first article)" "$code"
[ "$code" = 200 ] || fail=1

# 가이드 상세: 사이트맵에 있는 첫 주소 하나씩 (제품·동네·명소·시술·드라마)
for section in beauty/p/ travel/seongsu travel/place/ clinic/botox drama/; do
  url=$(curl -s "$BASE/sitemap.xml" | grep -o "<loc>$BASE/en/$section[^<]*" | head -1 | sed 's/<loc>//')
  code=$(curl -s -o /dev/null -w '%{http_code}' "$url"); printf '%-28s %s\n' "(en/$section…)" "$code"
  [ "$code" = 200 ] || fail=1
done

# 없는 카탈로그 항목은 평가 API 가 404
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/items/beauty/no-such-product")
printf '%-28s %s\n' "(unknown item → 404)" "$code"
[ "$code" = 404 ] || fail=1

# 검색 노출 범위: 색인하지 않는 언어의 가이드·치과·성형 시술은 X-Robots-Tag noindex, 영어 가이드는 헤더 없음 (src/lib/guide-seo.ts)
for p in /vi/beauty /ko/guide /en/clinic/implant; do
  tag=$(curl -s -o /dev/null -D - "$BASE$p" | grep -i '^x-robots-tag' | tr -d '\r')
  case "$tag" in *noindex*) ;; *) fail=1 ;; esac
  printf '%-28s %s\n' "$p" "${tag:-(no x-robots-tag)}"
done
tag=$(curl -s -o /dev/null -D - "$BASE/en/beauty" | grep -i '^x-robots-tag' | tr -d '\r')
[ -z "$tag" ] || fail=1
printf '%-28s %s\n' "/en/beauty" "${tag:-(indexable)}"
exit $fail
