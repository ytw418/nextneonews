# 검증: DB 장애로 운영 주소 대부분이 500, 오류 화면은 영어 기본 화면

`qa-edge.md` 1번 보고를 다시 재현했다. 코드는 고치지 않았다. 시각은 2026-10-20 00:05~00:11 KST다.

## 결론

| 항목 | 판정 | 근거 |
|---|---|---|
| 운영 주소 대부분이 500 | **재현됨(보고보다 나쁨)** | 사이트맵 무작위 60개 중 45개(75%)가 `500 MISS`. 보고는 40개 중 68%였다 |
| API 500 | **재현됨** | `/api/feed?locale=en&page=2`, `/api/next/en/<slug>`, `/api/article/en/<slug>`, `/api/comments?articleId=…` 모두 500 |
| 오류 화면이 영어 기본 화면이고 메뉴가 없음 | **재현됨(운영 + dev 빌드)** | WebKit(iPhone 15, ja-JP)에서 "This page couldn't load / Reload / ERROR …", 링크 0개, `<html>`에 `lang`이 없다 |
| `error.tsx`·`global-error.tsx` 없음 | **사실** | `apps/web/src/app` 아래에 `[locale]/not-found.tsx`만 있다. dev 빌드(`1bb6006`) 산출물에는 Next 기본 `_global-error.html`만 있다 |
| 설계상 의도인가 | 아니다 | `docs/monetize/*`·`deploy.md`·`revenue.md`에는 오류 화면에 대한 결정이 없다. `cost.md`는 복구 방법만 다룬다 |
| 심각도 | ① DB 복구는 **배포 막음**, ② `error.tsx`는 **중간** | ①이 안 되면 빌드가 실패해 배포 자체를 못 한다. ②는 다음 장애 때 피해를 줄이는 일이므로 배포를 막지 않는다 |

## 1. 운영 측정 (unnienote.app)

명령: 사이트맵 2,768개 → `random.seed(20261020)`로 60개 → `curl -w "%{http_code}"` + `x-vercel-cache` 헤더.

| 종류 | 500 | 200 | 비고 |
|---|---|---|---|
| 인물 `/idol/` | 31 | 1 | 인물은 빌드 때 만들지 않고 첫 요청 때 만든다(`idol/[slug]/page.tsx:50-53`) |
| 글 `/news/` | 13 | 9 | 글도 같다(`news/[slug]/page.tsx:56-59`). 캐시가 남은 것만 `STALE` |
| 랭킹 | 1 | 3 | |
| 일정 | 0 | 2 | |
| **합계** | **45 (75%)** | 15 (`STALE` 14, `PRERENDER` 1) | |

| 주소 | 결과 |
|---|---|
| `/en`, `/ko`, `/en/rankings` | 200 `STALE`(캐시) |
| `/ko/idol/apink` | 500 `MISS` |
| `/api/feed?locale=en&page=2` | 500 |
| `/api/comments?articleId=…` | 500 |
| `/api/next/en/ha-jung-woo-…-47c436` | 500 |
| `/en/guide`, `/ko/beauty`, `/en/saved` | 404(가이드는 아직 운영에 배포되지 않음) |

참고: 보고서의 `/api/feed`·`/api/comments`를 파라미터 없이 부르면 400(`{"error":"invalid"}`)이다. 올바른 파라미터를 넣으면 500이다.

## 2. 오류 화면

| 대상 | 방법 | 화면 |
|---|---|---|
| 운영 `/ja/news/lee-su-geun-…-3acb25` | WebKit iPhone 15, `ja-JP` | 영어 "This page couldn't load · A server error occurred. Reload to try again. · Reload · ERROR 3039832785". 링크 0개, 버튼은 Reload 하나. HTML은 `<html id="__next_error__">` |
| dev 빌드 + DB 한도 초과 흉내(아래 3절) `/ja/idol/…`, `/zh-tw/news/…` | 같은 방법 | 똑같은 영어 화면(ERROR 1380354130), 링크 0개, `lang` 없음 |
| dev 빌드 `localhost:3400/ja/news/a%00b` | 같은 방법 | 상태 500이지만 일본어 404 화면과 메뉴가 나온다. 이 오류는 DB 장애와 경로가 달라서(본문이 `notFound()`로 빠짐) 이번 판정에는 쓰지 않았다 |

캡처: `/tmp/predeploy-err/prod-ja-500.png`, `/tmp/predeploy-err/devbuild-dbdown-ja-500.png`, `/tmp/predeploy-err/devbuild-dbdown-zhtw-500.png`(저장소 밖, 임시).

## 3. 내일 배포할 dev 빌드에서도 같은가

`localhost:3400`은 로컬 DB가 살아 있어 DB 장애를 볼 수 없다. 그래서 같은 빌드(`/private/tmp/unnie-final`, `1bb6006`)를 APFS 복제(`cp -cR`)로 따로 떼어 내고, Neon 한도 초과(SQLSTATE 53000)를 돌려주는 가짜 Postgres(`qa-edge`의 `fakepg.py` 사본)에 붙여 3411번 포트로 띄웠다. 3400번 서버와 그 캐시는 건드리지 않았고, 측정 뒤 서버와 복제본을 지웠다.

| 주소(3411) | 결과 | 뜻 |
|---|---|---|
| 로컬 사이트맵 무작위 60개 | 60개 모두 200(`HIT` 50, `STALE` 10) | 캐시가 있으면 DB가 죽어도 열린다 |
| 캐시 없는 인물·글(`/ja/idol/no-such-person-zz`, `/ja/news/no-such-article-000000`) | 500, `__next_error__` | 캐시가 없으면 DB 조회에서 바로 실패한다 |
| `/ja`, `/ja/guide`, `/ja/beauty`, `/ja/saved` | 200 `HIT` | 가이드·저장함은 캐시로 열린다 → 제안한 `error.tsx`의 홈·가이드 링크가 실제로 갈 곳이 된다 |
| `/api/feed?locale=ja&page=2` | 500 | |
| 서버 로그 | `53000` 57건, Prisma `P2039` 57건 | 운영과 같은 종류의 오류 |

뜻: Vercel은 배포마다 ISR 캐시를 새로 시작한다. 그래서 DB가 다시 죽으면 새 배포에서는 처음 여는 인물·글 페이지가 **전부** 이 영어 화면이 된다. 지금 운영(75%)보다 더 나쁘다.

## 4. 보고서 제안 검토

| 제안 | 판단 |
|---|---|
| ① Neon 복구(요금제 또는 사용량) | 맞다. `cost.md` §8 ①(Launch 전환 + 상한 0.25~0.5 CU)과 같다. 사용자가 결정한다. 이게 안 되면 빌드가 실패해 배포를 못 한다(`cost.md:111`) |
| ② `app/[locale]/error.tsx` | 효과가 있다. `[locale]/layout.tsx`는 DB를 부르지 않아서(번역·스크립트만, `layout.tsx:1-24, 62-90`) 레이아웃 안에서 오류 화면을 그릴 수 있다. 9개 언어 문구, 홈·`/guide` 링크, 다시 시도 버튼을 넣는다. 다만 배포를 막을 일은 아니다 |
| `global-error.tsx` | 레이아웃 자체가 실패할 때만 쓰인다. 지금은 레이아웃이 DB를 안 쓰므로 우선순위가 낮다. 둘 경우 `<html lang>`을 직접 넣어야 한다 |
| 함께 볼 것 | `qa-edge.md` 3번: 한도 초과 오류(`P2039`)를 'DB 없음'으로 알아보지 못해 투표·항목 API가 0표 대신 500을 낸다. `error.tsx`와 같이 고치면 장애 때 피해가 더 준다 |

## 5. 다시 측정하는 법

```bash
# 운영 표본 (00:05 KST 기준 45/60 = 500)
curl -s https://unnienote.app/sitemap.xml | grep -o "<loc>[^<]*</loc>" | sed 's/<[^>]*>//g' > /tmp/u.txt
python3 -I -c "import random;u=open('/tmp/u.txt').read().split();random.seed(20261020);print('\n'.join(random.sample(u,60)))" \
 | while read u; do curl -s -o /dev/null -D /tmp/h -w "%{http_code} " "$u"; grep -i x-vercel-cache /tmp/h | tr -d '\r'; done | sort | uniq -c
```

DB를 되살린 뒤 같은 명령을 다시 돌리면 500이 0이어야 한다.
