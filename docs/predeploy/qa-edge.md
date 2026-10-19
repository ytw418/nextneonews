# 배포 전 QA — 회귀·엣지·보안 (2026-10-20 새벽, dev `1bb6006`)

대상: 로컬 운영 빌드 `http://localhost:3400`(`/private/tmp/unnie-final`, 같은 커밋, 로컬 DB). 운영(`unnienote.app`)은 GET 요청으로만 확인했다. 코드는 고치지 않았다.
재현 스크립트(임시, 저장소 밖): `/tmp/qa-edge/bin/` 의 `sweep.mjs`(페이지 훑기), `storage.mjs`(저장소 막힘), `saved.mjs`(저장 350개·공유 코드·인앱), `slow.mjs`(느린 망), `req.sh`(API 입력), `/tmp/qa-edge/sim/`(DB 한도 초과 흉내).

## 1. 결론

- 기존 기능 회귀는 없다. 사이트맵 1,555개 주소가 모두 200이다. 주요 38개 화면의 내부 링크 659개도 모두 200이다. WebKit·Chromium에서 콘솔 오류와 하이드레이션 오류가 0건이고, 봇 눈 검사(`crawl-check`)는 GPTBot·ClaudeBot·Googlebot 모두 27/27이다.
- 운영 상태가 가장 급하다. 운영 사이트맵에서 40개를 뽑아 보니 **27개(68%)가 지금 500**이다. 화면은 영어로 된 Next 기본 오류("This page couldn't load")이고 메뉴도 없다. DB를 되살리기 전에는 배포 자체가 막힌다(빌드 실패). `cost.md` 참고.
- 새 기능 보안에서 가장 큰 문제는 **투표 조작**이다. 브라우저 UA를 한 글자만 바꿔도 새 표로 센다. 혼자 한 시간에 30표를 넣을 수 있고, 이 정도면 어워드 1위와 구글 별점(구조화 데이터)을 바꿀 수 있다.
- 비밀값 유출, XSS, 에러 응답의 내부 정보 노출은 없다.

## 2. 고칠 것 (심각도순)

| # | 심각도 | 문제 | 근거(재현) | 고치는 법 | 노력 |
|---|---|---|---|---|---|
| 1 | 배포 막음 | DB가 꺼져 운영 주소 68%가 500이고, 오류 화면은 영어 기본 화면이다 | 운영 사이트맵 표본 40개: 인물 15/15, 글 9/18, 랭킹 3/6이 `500 MISS`. 캐시가 남은 13개만 `200 STALE`이다. `/api/feed`·`/api/comments`·`/api/next`도 500. 오류 화면 문구는 "This page couldn't load … ERROR 3039832785"이다. `app/[locale]/error.tsx`와 `global-error.tsx`가 없다 | ① DB 복구(요금제는 사용자가 결정, `cost.md`). ② `app/[locale]/error.tsx`를 만든다(9개 언어 문구, 홈·가이드 링크, 다시 시도 버튼). 홈·가이드는 캐시로 열리므로 갈 곳이 생긴다 | ① 결정 ② S |
| 2 | 높음 | 같은 기기에서 UA 문자열만 바꾸면 새 표로 센다. 혼자서 어워드 순위와 별점을 바꿀 수 있다 | `lib/voter.ts:11-13` 의 voterHash가 IP+UA로 만들어진다. 로컬에서 같은 IP로 UA 끝에 `qa-A`·`qa-B`를 붙이니 둘 다 `counted:true`였다(`queen-of-tears` 표 2→4). 막는 장치는 IP당 시간당 30표(`item-votes.ts:17`)뿐이다. 순위 점수는 `편집점수 + 25×(인생템−별로)/(표+5)`(`beauty.ts:46-51`)이다. 30표면 +21점이 붙는데, 편집 점수 차이는 76~95(19점)라 어느 제품이든 1위가 된다. 5표만 모여도 Product `aggregateRating`이 나간다(`jsonld-catalog.ts:57-66`, `vote-rules.ts:2`). 투표·반응·응원(`engagement.ts:134,169`, `cheer/route.ts:39`)도 같은 구조다 | `queryTotals`가 집계할 때 같은 `ipHash`에서 온 표는 항목마다 최대 2표까지만 센다(`COUNT(DISTINCT)`나 groupBy에 ipHash 추가). `MIN_VOTES_FOR_SUMMARY`·`AWARDS_MIN_VOTES` 판정도 이 값으로 한다. 기기 ID(localStorage 난수)를 표와 함께 보내 voterHash의 UA 대신 쓰면 #13도 같이 풀린다 | M |
| 3 | 중간 | 지금 운영에서 나는 오류(Neon 한도 초과)를 'DB 없음'으로 알아보지 못한다. 0표로 대신 그리는 장치가 작동하지 않는다 | 가짜 Postgres가 53000 오류를 돌려주게 했다(`/tmp/qa-edge/sim`). Prisma는 이것을 **`P2039`**로 넘긴다. `isDbUnavailable` 목록(`item-votes.ts:94`)에는 이 코드가 없어서 결과가 false다. 같은 방식으로 포트를 끄면 `P1001`이 나오고 이때는 true다. 그래서 한도 초과일 때 `/api/items` GET은 200·0표 대신 500을, 투표는 503 대신 500을 준다. 제품·드라마·시술 화면의 재생성과 빌드도 이 조회에서 실패한다 | 목록에 `P2039`·`P1000`·`P1002`·`P1008`·`P2037`을 더한다. 또는 `err.meta.driverAdapterError.cause.originalCode`가 `53`·`57P`·`08`로 시작하면 '불가'로 본다 | S |
| 4 | 중간 | Threads·TikTok·WeChat 앱 안 브라우저를 알아보지 못해 '저장이 사파리로 안 넘어간다'는 경고가 뜨지 않는다 | `components/saved/sendList.ts:13` 의 판별식은 `/Instagram\|FBAN\|FBAV\|\bLine\//`이다. 실측: Instagram·LINE에서는 경고가 뜨고, Threads(`Barcelona`)·TikTok(`BytedanceWebview`)에서는 뜨지 않았다. 다음 주 1순위 유입 채널이 Threads다(`RESULT.md`) | 판별식에 `Barcelona\|BytedanceWebview\|musical_ly\|MicroMessenger\|KAKAOTALK\|xhsdiscover`를 더한다. `InstallPrompt.tsx:44`와 같은 정규식 하나를 `lib`에 두고 함께 쓴다 | S |
| 5 | 중간 | 가이드 상세 주소가 틀리면 영어로 된 맨 404가 나온다. 언어도 메뉴도 없다 | `/ja/beauty/p/discontinued-product`는 7,673B짜리 "404 This page could not be found."를 낸다. `/en/c/unknown`이 사이트 화면 안의 404를 내는 것과 다르다. 원인은 `dynamicParams = false`인 9개 페이지다(beauty/p·awards·skin-type, travel/[area]·place, clinic, drama, schedule, rankings). 카탈로그에서 뺀 제품이 저장함·공유 링크·검색 결과에 남아 있으면 이 화면으로 간다 | 9개 파일에서 `dynamicParams = false`를 지운다. 모두 이미 `notFound()`를 부르므로 `[locale]/not-found.tsx`가 레이아웃 안에서 그려진다. `/en/foo` 같은 없는 경로까지 잡으려면 `[locale]/[...rest]/page.tsx`(notFound)를 둔다 | S |
| 6 | 중간 | 조회 수 API에는 봇 거르기·횟수 제한·중복 제거가 없다. '이번 주 인기' 순위를 조작할 수 있고, 요청마다 DB에 쓴다 | `api/views/[id]/route.ts:5-8`. `python-requests` UA로 10번 연속 보내니 모두 204였다. 조회 수는 홈 인기(`articles.ts:119-121`)와 다음 글 가이드 순서에 쓰인다. 요청 하나가 Neon을 한 번 깨운다(기존 코드) | `isBot(ua)`이면 쓰지 않고 204를 준다. Vercel Firewall에 `POST /api/*` 횟수 제한 규칙(IP당 분당 30회 정도)을 하나 걸면 쓰기 API 전체와 DB 사용량을 함께 막는다 | S |
| 7 | 낮음 | 다른 사이트가 방문자 브라우저를 시켜 투표·반응·신고를 보낼 수 있다(CSRF) | 모든 POST가 `request.json()`으로 본문을 읽고 content-type은 보지 않는다. `Origin: https://evil.example` + `text/plain`으로 보내도 항목 투표·반응이 검증을 통과했다(카탈로그에 없는 항목이라 404). 방문자마다 IP가 달라 IP 제한도 피한다 | 공용 `sameOrigin(req)`를 만든다. `Sec-Fetch-Site: cross-site`이거나 Origin 호스트가 SITE_URL과 다르면 403을 준다. content-type은 `application/json`만 받는다. 투표·반응·응원·댓글·신고·조회 6곳에 적용한다 | S |
| 8 | 낮음 | 안드로이드 홈 화면 아이콘과 아이폰 설치 안내 카드가 옛 브랜드 'H.'다 | `api/pwa-icon/route.tsx:28`, `InstallPrompt.tsx:161`. 운영 `/api/pwa-icon?size=192`도 H다. 파비콘·apple-icon은 U로 바뀌었다(커밋 `9174928`에서 두 곳을 빠뜨림). 카드 캡처 문구: "H. Add Unnie Note to your Home Screen" | 두 곳의 `H`를 `U`로 바꾼다 | S |
| 9 | 낮음 | 저장이 300개 찬 상태에서 공유 목록을 가져오면, 원래 있던 오래된 항목 100개가 아무 안내 없이 빠진다 | `lib/saved.ts:71-75` 의 `withAdded`가 합친 뒤 300개로 자른다. 가져온 항목의 시각이 '지금'이라 내 항목이 밀려난다. 실측: 토스트는 "Added 100 picks", 결과는 내 항목 200/300 | 남은 칸만큼만 더하고, 배너에 "n개만 들어가요"를 띄운다. 또는 가져온 항목을 내 목록 뒤에 붙인다 | S |
| 10 | 낮음 | 주소에 널 문자(`%00`)가 들어가면 API·화면이 500을 낸다 | `/api/views/a%00b`, `/api/comments?articleId=a%00b`, 반응·응원·투표·다음 글, `/en/news/a%00b`, `/en/idol/a%00b`가 모두 500이다. Postgres의 UTF-8 오류다. 응답에 내부 정보는 없었다(빈 본문, digest만). 스캐너가 오류 로그를 채우고, 그 요청은 캐시되지 않는다 | 핸들러와 `news/[slug]`·`idol/[slug]`가 DB를 부르기 전에 slug·id 모양을 검사한다(`ARTICLE_SLUG`, cuid 정규식). 틀리면 404를 준다 | S |
| 11 | 낮음 | 보안 헤더가 없다. iframe에 넣어 투표 버튼을 누르게 하는 공격(클릭재킹)이 가능하다 | 응답 헤더에 X-Frame-Options·CSP·nosniff·Referrer-Policy가 없고, `X-Powered-By: Next.js`가 노출된다. 운영 HSTS는 Vercel이 넣는다. `next.config.ts:40-41`은 noindex 헤더만 둔다 | `headers()`에 `/:path*` 규칙을 하나 더한다: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. `poweredByHeader: false` | S |
| 12 | 낮음 | 사파리 사생활 보호처럼 저장소가 막히면 저장이 새로고침에 사라지는데, 화면은 "이 브라우저에 저장했어요"라고 한다 | localStorage·sessionStorage·쿠키를 막고 실행했다. 저장·저장함 이동·퀴즈·이어 읽기·홈 스크롤은 오류 없이 된다. 새로고침하면 저장함이 비고, 토스트는 "Saved on this browser only"다 | `storageSet`이 성공 여부를 돌려주게 한다. 실패하면 첫 저장 토스트를 "이 창을 닫으면 사라져요"로 바꾼다 | S |
| 13 | 낮음 | 같은 와이파이에서 같은 iOS 버전을 쓰는 두 사람이 투표하면 한 표로 합쳐진다(뒤 사람이 앞 표를 덮는다) | voterHash가 IP+UA라서 두 사람이 같은 행이 된다(`item-votes.ts:149` upsert). 같은 UA로 다시 보내면 `counted:false`인 것을 확인했다. 모바일 통신사 공용 IP(대만·인니)에서도 생긴다 | #2의 기기 ID로 함께 해결한다 | — |

`perf.md` #2(저장함 budoux로 JS +160KB)는 이 점검에서도 같은 결과가 나왔다. Slow 3G에서 `/en/saved` LCP가 13.7초로, 다른 화면의 5.3초보다 길다.

## 3. 회귀 점검 — 통과

| 항목 | 방법 | 결과 |
|---|---|---|
| 사이트맵 전체 | 1,555개 주소 `curl` | 모두 200, 가장 느린 것 0.68초 |
| 내부 링크 | 38개 화면(9개 언어 섞음)의 href 659개 | 모두 200 |
| 화면 41개(홈 6개 언어·글·카테고리·쪽·랭킹·일정·인물·가이드 전 섹션·저장함·정책) | WebKit iPhone 15, Chromium | 200, 콘솔·하이드레이션 오류 0, 실패 요청 0, 가로 넘침 0 |
| 긴 제목·긴 언어 | 375·360px에서 142개 화면(105자 제목 글, ja 제품 50, ja 드라마, zh-TW 명소, ru·fr·vi·id) | 넘침 0. 320px(1세대 SE)에서는 ru 화면이 11px 넘침(드문 기기라 무시해도 됨) |
| 이어 읽기·피드 | 글 끝까지 스크롤 / 홈 끝까지 | 글 4편이 붙고 주소가 바뀜 / 링크 117개 |
| 댓글 | 작성·목록·삭제 | 201·200·204, 링크 금지 422, 꿀단지 칸 400 |
| 봇 눈(JS 없이) | `crawl-check --article …lee-soo-man…` | 27/27 ×3 봇. 기본 선택 글은 핵심 요약이 없는 로컬 데이터라 실패 4건이 나왔지만 코드 문제가 아니다 |
| JS 끔 | 41개 화면 본문 글자 수 비교 | JS를 켰을 때와 같다. 저장함은 제목만, 피부 퀴즈 버튼은 동작하지 않음(설계상) |
| 검색 파일 | robots·llms·feed 9개 언어·news-sitemap·sitemap XML 파싱 | 모두 정상. ads.txt·indexnow는 로컬에 키가 없어 404(정상) |
| 노출 범위 | ko·vi 가이드, 치과·성형 | `X-Robots-Tag: noindex`, 사이트맵에서 빠짐 |
| 옛 도메인 | Host를 `hallyu-brief.vercel.app`·`www`로 바꿔 요청, 운영 실측 | 301, 경로·쿼리 유지 |
| 대문자 언어 | `/EN`·`/Ja`·`/ZH-TW`·`/EN/beauty` | 307 → 소문자, 반복 이동 없음 |
| PWA | manifest·sw.js·아이콘 | 200(아이콘 모양은 #8) |
| 캘린더 | `/api/calendar/zh-TW/mma-2026` | 200 text/calendar, 화면 링크도 zh-TW |

## 4. 엣지·보안 측정

| 항목 | 결과 |
|---|---|
| 저장소·쿠키 막힘 | 오류 0. 저장은 이번 방문 동안만 남는다(#12) |
| 저장 350개 | 화면 "Saved 300 items"(상한 동작). `/api/saved`를 100개씩 3번 부르고 주소는 최대 7,179자, 모두 200. 없어진 항목 68개는 '불러오지 못함' 줄로 남는다 |
| 공유 코드 `?i=` | 깨진 base64·빈 값·`<script>` 항목·12KB 값: 배너 없음, 오류 0. 없는 항목은 배너에 셈(REVIEW-LEFT에 이미 있음). 40KB면 로컬 431, 운영 15KB는 200. 글 100개짜리 공유 주소는 약 8,000자 |
| 인앱 UA | Instagram·LINE 경고 표시, Threads·TikTok은 표시 안 됨(#4) |
| 느린 망 | Fast 3G: 홈 FCP 1.7초, 제품 1.5초. Slow 3G: FCP 5.0~5.3초, 저장함 LCP 13.7초 |
| API 잘못된 입력 | 22가지 형식 오류 모두 400·404·422, JSON 깨짐 400, 없는 항목 404, 봇 UA(curl) 투표 403 |
| `/api/*` 전부 500 흉내 | 글·제품·홈·저장함·드라마 화면 오류 0, 화면 유지 |
| XSS | 닉네임 `<b onclick=x>`, 본문 `<script>`·`<img onerror>`를 댓글로 등록 → 화면에 글자로만 보이고 대화상자 0. JSON-LD는 `<`를 이스케이프하고(`JsonLd.tsx:6`), 이어 붙이는 본문은 micromark 기본값(raw HTML 이스케이프) |
| 헤더 주입·열린 이동 | `.ics` 파일 이름은 정적 id만 들어간다. `//evil.com/`은 같은 호스트 안으로 308 |
| 비밀값 | `.next/static` JS 42개(1.9MB)와 서버 HTML 5개에서 `.env` 값 6개를 찾았다. 비공개 값은 0개(SITE_URL만 나옴). 클라이언트 컴포넌트의 `process.env`는 NODE_ENV·NEXT_PUBLIC만 쓴다 |
| `/api/revalidate` | 비밀값이 없거나 틀리면 401, 시간 일정 비교 |
| IP 바꾸기 | 로컬에서는 `x-real-ip` 헤더로 바꿀 수 있다. Vercel은 이 헤더를 덮어쓰므로(공식 문서) 운영에서는 IP를 바꿀 수 없다. 운영 도메인은 IPv6(AAAA)가 없어 IPv6 주소를 돌려 쓰는 우회도 안 된다. 실제 구멍은 UA다(#2) |

## 5. 테스트가 로컬 DB에 남긴 것

- `drama/queen-of-tears`에 별 5점 4표(UA를 바꾼 시험). 이제 표가 5개라 로컬 미리보기에 평균 별점이 보일 수 있다.
- 글 `cmv9przt90001n7f8vbkdw9fc`(부산 불꽃축제) 조회 수 +10.
- 시험 댓글 1개는 만든 뒤 지웠다.
- 운영 DB에는 아무것도 쓰지 않았다(GET만).
