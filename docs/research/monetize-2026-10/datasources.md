# 스크립트로 모을 수 있는 데이터 원천 조사 (조회일 2026-10-19)

표기: **[확인]** = 이번 조사에서 직접 열거나 내려받아 확인. **[추정]** = 확인하지 못한 부분. 공공데이터포털 키가 없어 API 호출은 시험하지 못했고, 안내 페이지 기준이다. AI 없이 스크립트만으로 수집하는 것을 전제로 한다.

## 1. 결론

- 무료이고 상업 이용이 열려 있는 원천은 대부분 **공공데이터포털(data.go.kr)** 에 있다. 이용허락범위가 "제한 없음" 또는 공공누리 1유형(출처표시)이다 [확인].
- **막힌 곳**: 올리브영(robots.txt 까지 403), 화해(랭킹·상품 경로 Disallow), 지니(전체 Disallow), 벅스, 스포티파이(개발자 약관), 넷플릭스(robots·약관의 자동 수집 금지). 자동 수집하지 않는다.
- **TMDB 는 못 쓴다**: 광고로 수익을 내는 사이트는 상업 이용이라 별도 서면 계약과 요금이 필요하다 [확인]. 위키데이터·TVmaze 로 대신한다.
- **합법 무료 원천이 없는 곳**: K-뷰티 상품 랭킹, 케이팝 컴백 일정. 자체 데이터(즐겨찾기·클릭)와 큐레이션으로 만든다.
- 이 저장소는 이미 `TOS_BLOCKED_HOSTS`(올리브영 KR·지니·벅스 등)와 위키데이터 `entities` 동기화를 갖고 있다. `global.oliveyoung.com` 은 차단 목록에 없으니 `oliveyoung.com` 을 추가해야 한다 [확인: `apps/worker/src/collectors/policy.ts`].

## 2. 여행

| 원천 | 형태·인증 | 다국어 | 상업 이용·라이선스 | robots | 갱신 | 예시 |
|---|---|---|---|---|---|---|
| TourAPI 4.0 국문·영문·일문·중문 간체·번체 (한국관광공사) | REST JSON·XML. 포털 가입 후 활용신청, 무료. 개발계정 자동승인 **1,000콜/일**, 운영계정은 심의 후 활용사례 등록으로 증설 [확인] | 국·영·일·중간·중번 (불어·서어 등도 별도 서비스) | "제한 없음". 사진은 공공누리 1·3유형 혼재(3유형은 변경 금지, `cpyrhtDivCd` 로 구분), 기업 CI 사용 금지 [확인] | api.visitkorea.or.kr 전체 허용 | 실시간 | `https://apis.data.go.kr/B551011/EngService2/areaBasedList2` (그 밖에 `locationBasedList2`, `searchKeyword2`, `detailCommon2`, `areaBasedSyncList2` 증분 동기화) |
| 한국관광공사 의료관광정보 | 위와 같음, 개발 1,000콜 | 다국어 | 제한 없음 | 위와 같음 | 실시간 | `.../B551011/MdclTursmService` |
| 한국관광공사 웰니스관광정보 | 위와 같음 | 언어 미확인 | 제한 없음 | 위와 같음 | 실시간 | 포털 15144030 |
| **한국문화정보원 미디어콘텐츠 영상 촬영지** | CSV 15,034행, 로그인 없이 다운로드 | 한국어 | 제한 없음 [확인] | data.go.kr | 1회성 | 포털 15111405 |
| 서울 드라마·CF 촬영장소 | 파일(링크 1행), 중국어 간체판 있음 | 한·중간 | 공공누리 1유형 | data.seoul.go.kr 허용 | 1회성 | 포털 15052437, 15052439 |
| 한국영상자료원 영화 로케이션 촬영이력 | CSV | 한국어 | 제한 없음 | - | 1회성 | 포털 15109020 |
| 서울 열린데이터광장 | REST, 인증키 즉시 발급·무료, 요청당 최대 1,000건 | 데이터셋별 | 안내 페이지에 라이선스 표기 없음, 데이터셋별 확인 필요 | data.seoul.go.kr 허용. `openapi.seoul.go.kr` 은 이 환경에서 시간 초과 | 데이터셋별 | `http://openapi.seoul.go.kr:8088/{키}/json/{서비스명}/1/1000/` |

- 촬영지 CSV 실측 [확인]: 작품 1,028개. 유형은 drama 7,339, show 5,460, **artist 1,962**(케이팝 가수가 다녀간 곳), movie 273. 장소는 식당·놀이시설·카페·숙박 순. 주소·좌표·영업시간 포함. **다만 최종작성일이 모두 2022-11-25 이전**이라 폐업 가능성이 크다. TourAPI 로 교차 확인해야 한다.
- 서울 열린데이터는 해외 IP 에서 막힐 수 있다 [추정]. 저장소의 `infra/collector-relay` 를 통과시킨다.

## 3. K-뷰티

| 원천 | 형태·인증 | 상업 이용·robots | 판정 |
|---|---|---|---|
| 올리브영 KR 랭킹 | HTML | robots.txt·랭킹 페이지 모두 403 [확인] | **금지** (이미 차단 목록) |
| 올리브영 글로벌 | HTML | robots.txt 403 "Access restricted" [확인] → 규칙을 읽을 수 없음 | **금지**. 대신 제휴 프로그램(기본 13%, 월 PayPal) 링크만 사용 |
| 화해 랭킹 | HTML | robots: `/hwahae-rank`, `/goods-view`, `/product-search`, `/api/` Disallow [확인] | **금지** |
| 식약처 화장품 원료성분정보 | REST, 키 무료, 개발 **10,000콜** | 제한 없음, 실시간 [확인] | 성분 사전 |
| 식약처 기능성화장품 보고품목정보 | 위와 같음 | 제한 없음, 최종 수정 2026-08-10 [확인] | 제품·효능(미백·주름·자외선) 목록 |
| 식약처 화장품 사용제한 원료 | 위와 같음 | 제한 없음 | 성분 주의 표시 |
| 네이버 데이터랩 쇼핑인사이트 | 클라이언트 ID·시크릿(무료), **1,000콜/일** [확인] | 상업 이용·저장 조건은 약관 미확인 [추정] | 한국 내 키워드 인기 추이(랭킹 대용) |

- 식약처 엔드포인트: `https://apis.data.go.kr/1471000/CsmtcsIngdCpntInfoService01`, `.../FtnltCosmRptPrdlstInfoService01`. 한국어뿐이라 번역이 필요하다(기존 배치 번역 사용).
- 외국인이 보는 상품 랭킹을 공개 원천으로 만들 수는 없다 [추정]. 제휴 클릭·즐겨찾기 수로 만든 자체 랭킹이 현실적이다. 어필리에이트 네트워크 상품 피드는 조건을 확인하지 못했다.

## 4. 의료

| 원천 | 형태·인증 | 상업 이용 | 갱신 | 비고 |
|---|---|---|---|---|
| 한국보건산업진흥원 외국인환자 유치기관 현황 | CSV 6,921행, 다운로드 | 제한 없음 | **연 1회** (차기 2027-07-21) | [확인] 컬럼은 번호·상태·상호명·대표자명·기관구분·지역뿐. 주소·진료과목 없음. 이름에 성형 635·피부 356·치과 528 포함(직접 집계) |
| 심평원 병원정보서비스 | REST XML, 개발 10,000콜 | 공공누리 1유형(출처표시) | 실시간 | `https://apis.data.go.kr/B551182/hospInfoServicev2`. 요양기호는 암호화값 |
| 심평원 의료기관별 상세정보 | REST JSON·XML | 출처표시 | 실시간 | `.../B551182/MadmDtlInfoService2.8`: 진료과목·전문의 수·교통·장비 [확인] |
| 심평원 비급여진료비정보 | REST XML | 출처표시 | 실시간 | **병원급 이상만** 제공 [확인]. 성형·피부과 의원 대부분이 빠진다 |
| 우수 유치의료기관 인증(KAHF) | 구조화 목록·API 없음 [확인 못함] | - | - | 2023-12 기준 13개소 보도. 한국보건산업진흥원 주관, 의료기관평가인증원 평가. 수동 시드 |

- 연결 방법: 유치기관 CSV(상호명+지역)를 심평원 병원 목록과 이름·시도로 맞춰 진료과목·좌표를 붙인다. 이름이 비슷한 의원이 많아 일치율은 시험해야 한다 [추정].
- 의료 광고·환자 유인 규제 때문에 병원 순위·후기 문구는 법무 확인이 필요하다 [추정].

## 5. 드라마

| 원천 | 형태·인증 | 상업 이용·robots | 갱신 | 판정 |
|---|---|---|---|---|
| **Netflix Top 10** | TSV 직접 내려받기 가능 [확인]: `https://www.netflix.com/tudum/top10/data/all-weeks-global.tsv`(0.9MB), `.../all-weeks-countries.tsv`(32MB, 국가 코드 포함). 최신 주 2026-10-04 | robots `User-agent: *` **Disallow: /** (허용 봇만 Allow). 이용약관 1.8 은 별도 허락 없는 한 자동화 접근·상업 이용을 금지 [확인]. TSV 별도 허락 문구는 못 찾음 | 매주 화요일 | **사람이 주 1회 내려받아 업로드**, 스크립트는 파싱만 |
| TMDB API | REST, 키 | 광고 수익 사이트는 상업 이용 → 서면 계약·요금 필요 [확인] | 실시간 | **사용 안 함** |
| 위키데이터 SPARQL | `https://query.wikidata.org/sparql`, 키 없음 | CC0. 60초 제한, IP당 5병렬, 설명 있는 User-Agent 필수 [확인] | 실시간 | **사용** (이미 `entities` 동기화) |
| TVmaze API | REST, 키 없음 | CC BY-SA, 출처 링크, 20콜/10초 [확인] | 실시간 | 보조(방영 일정). 한국 드라마 2편 검색 시험 통과 |
| 닐슨코리아 시청률 | HTML | robots 404, 약관·재사용 조건 못 찾음. 서비스 계약 판매 구조 | 매일 | 수집 보류 [추정] |
| 굿데이터 펀덱스 | `fundex.fun` 단일 페이지 앱 | robots 404, API·약관 못 찾음 | 매주 화요일(보도 기준) | 수집 보류 [추정] |

- 위키데이터 실측(오늘 쿼리) [확인]: 2025년 이후 방영 시작한 한국 TV 시리즈 **250개**, 그중 번체 라벨 119개, TMDB ID(P4983) 보유 224개. 번체 라벨이 절반이라 `Translation` 으로 보강해야 한다.
- 넷플릭스 국가별 파일에는 TW·JP·HK·SG·US·KR 등 약 90개국이 있어 "대만에서 지금 뜨는 한국 드라마"를 만들 수 있다. 제목이 영문 문자열이라 위키데이터 이름과 맞추는 작업이 필요하다.

## 6. 케이팝

| 원천 | 형태·인증 | 상업 이용·robots | 판정 |
|---|---|---|---|
| Apple Music 차트 RSS | `https://rss.marketingtools.apple.com/api/v2/kr/music/most-played/100/songs.json`, 키 없음 [확인] | 이용 조건 페이지 못 찾음 [추정]. 장르 `K-Pop` 필터: KR 100곡 중 76곡, TW·US 는 0곡, JP 는 오류 | 한국 내 인기곡 대용. **사용** |
| YouTube Data API v3 | 구글 클라우드 키 무료, **10,000유닛/일**, `videos.list` 1유닛, `search.list` 하루 100콜 [확인] | 저장한 통계는 30일 안에 갱신·삭제. 유튜브 데이터 외 다른 콘텐츠가 있는 페이지에서는 광고 가능 [확인] | 공식 채널 업로드·조회수. **사용** |
| 서클차트 | HTML | robots 404. 푸터에 "AI/ML·TDM 무단 이용 금지", "차트제휴신청" 메뉴 [확인] | 제휴 없이는 보류 |
| 멜론 | HTML | robots: `*` 는 `/global-k-chart` 만 허용, 나머지 Disallow. 해당 경로는 curl 403 [확인] | 보류 |
| 지니 | HTML | `*` 전체 Disallow [확인] | **금지** |
| 스포티파이 차트·API | 로그인 | 개발자 약관: 로봇 수집 금지(IV.2.4.1), 판매 금지(V.5), 개인용 [확인] | **금지** |
| MusicBrainz | REST | 초당 1회, User-Agent 필수 [확인]. 라이선스는 못 확인 | 보조(발매일) |
| 컴백 일정 | dbkpop.com 은 오늘 서버 오류(500), 약관 못 봄. 나무위키는 라이선스가 상업 이용 불가일 가능성 [추정] | - | 단일 합법 원천 없음 |

- 컴백 일정은 공식 채널의 티저 업로드 감지(YouTube) + 아이튠즈 검색 API 의 `releaseDate` + 사람 입력을 합쳐 만든다.

## 7. 바로 붙일 것 TOP 6

모두 기존 구조(GitHub Actions 일일 단계, `apps/worker/src/cli.ts` 명령, Prisma)에 맞춘 제안이다. 공통: 새 표 `CollectRun(source, startedAt, status, rows, error)`.

| # | 수집 | 주기 | 저장 표(제안) | 실패 시 |
|---|---|---|---|---|
| 1 | TourAPI 5개 언어 + 의료관광 + 웰니스 (`areaBasedSyncList2` 증분 → 바뀐 것만 `detailCommon2`·`detailImage2`) | 매일 05시 KST | `Place`(id `tour:{contentid}`, 언어별 이름·설명 JSON, 좌표, 사진 URL·저작권 유형, 수정시각) | 429·쿼터 초과면 즉시 중단, 마지막 커서 저장 후 다음 날 이어받기. 5xx 는 1·4·16초 후 3회 재시도. 사진은 3유형이면 가공하지 않는다 |
| 2 | 촬영지 CSV 3종 적재(문화정보원 15,034행 + 서울 + 영상자료원), 작품명을 `Entity`(위키데이터)와 연결 | 처음 1회, 이후 분기마다 포털 수정일 확인 | `FilmingLocation`(작품, 장소, 유형, 주소, 좌표, 작성일, `entityId`, 폐업 의심 플래그) | 다운로드 실패면 이전 데이터 유지. 행 수가 이전의 70% 미만이면 적재 보류. 인코딩은 CP949 |
| 3 | 유치기관 CSV + 심평원 병원정보·상세 결합(시도+이름 일치) | CSV 연 1회, 심평원 주 1회 | `Clinic`(심평원 요양기호, 이름, 종별, 지역, 좌표, 진료과목, 전문의 수, 유치기관 등록 여부, 매칭 신뢰도) | 매칭 안 된 기관은 `unmatched` 로 남겨 화면에 노출하지 않는다. 심평원 쿼터 초과면 다음 날 이어받기 |
| 4 | 식약처 원료성분 + 기능성 보고품목 + 사용제한 원료 | 주 1회 (최근 수정분만) | `Ingredient`, `CosmeticReport` (한국어 원문 + 번역 칸) | 응답 형식이 달라지면 해당 실행만 실패 처리하고 이전 표 유지 |
| 5 | Netflix Top 10 TSV(사람이 받은 파일) 파싱 + 위키데이터 이름 매칭 | 매주 화요일 오후 사람이 업로드 → 즉시 파싱 | `ChartEntry(chart, scope=국가, period, rank, title, entityId?)` → 기존 `RankingSnapshot` 에 출처 표기 | 파일이 없으면 지난주 유지. 열 이름이 바뀌면 중단. 매칭 실패 제목은 `entityId` 비움 |
| 6 | Apple KR K-Pop 필터 + YouTube 공식 채널 업로드·조회수(MV 조회수, 티저 제목 패턴으로 컴백 감지) | Apple 매일, YouTube 6시간마다(`playlistItems.list` 1유닛) | `ChartEntry`(source=apple), `EntityMetric`(source=`youtube:views`), `Release`(artist, 제목, 예정일, 근거 URL) | 쿼터는 `CollectRun` 에 기록해 80% 넘으면 간격을 늘린다. 30일 지난 통계는 삭제 또는 갱신 |

**보류**: 네이버 쇼핑인사이트(약관 확인 후), 서울 열린데이터(릴레이 필요), 서클차트(제휴 문의). **하지 않을 것**: 올리브영·화해·지니·벅스·스포티파이·TMDB.

## 출처 (조회 2026-10-19)

- TourAPI: https://www.data.go.kr/data/15101578/openapi.do , https://www.data.go.kr/data/15101753/openapi.do , https://www.data.go.kr/data/15143913/openapi.do , https://api.visitkorea.or.kr/robots.txt
- 촬영지·의료 파일: https://www.data.go.kr/data/15111405/fileData.do , https://www.data.go.kr/data/15052437/fileData.do , https://www.data.go.kr/data/15109020/fileData.do , https://www.data.go.kr/data/3050000/fileData.do
- 심평원: https://www.data.go.kr/data/15001698/openapi.do , https://www.data.go.kr/data/15001699/openapi.do , https://www.data.go.kr/data/15001700/openapi.do
- 식약처: https://www.data.go.kr/data/15111774/openapi.do , https://www.data.go.kr/data/15095680/openapi.do
- 서울: https://data.seoul.go.kr/together/guide/useGuide.do
- 인증 보도: https://m.dailypharm.com/user/news/21219
- 올리브영 제휴: https://global.oliveyoung.com/influencer/main ; robots: https://global.oliveyoung.com/robots.txt , https://www.hwahae.co.kr/robots.txt
- Netflix: https://www.netflix.com/tudum/top10 , https://www.netflix.com/robots.txt , https://help.netflix.com/legal/termsofuse
- TMDB: https://www.themoviedb.org/api-terms-of-use , https://developer.themoviedb.org/docs/faq
- 위키데이터: https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual , https://www.wikidata.org/wiki/Wikidata:Licensing
- TVmaze: https://www.tvmaze.com/api
- 닐슨코리아: https://www.nielsenkorea.co.kr/tv_terrestrial_day.asp ; 펀덱스: https://fundex.fun/
- 케이팝: https://circlechart.kr/ , https://www.melon.com/robots.txt , https://www.genie.co.kr/robots.txt , https://developer.spotify.com/terms , https://rss.marketingtools.apple.com/ , https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
- YouTube: https://developers.google.com/youtube/v3/determine_quota_cost , https://developers.google.com/youtube/terms/developer-policies
- 네이버 쇼핑인사이트: https://developers.naver.com/docs/serviceapi/datalab/shopping/shopping.md
