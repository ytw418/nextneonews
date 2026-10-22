# 04. 마케팅

## 현재 숫자 (PostHog, 내부·미리보기 제외)

10/21(수) 하루 — 아침 브리핑 기준:
- 방문자 162(전날 125 → +29.6%), 세션 173, 페이지뷰 387
- 이탈률 63.6%, 평균 세션 1분 3초(전날 2분 20초에서 -54.8%)
- 유입: **검색 131명**(google 102 · yahoo.co.jp 22 · coccoc 2), 직접 31, **SNS 0**, 추천 1
- 언어: fr 42 · ja 57 · vi 32 — 해외 언어 글이 검색에 걸리기 시작
- 7일(10/15~21): 방문자 356, 세션 388, 이탈률 58%, 평균 세션 1분 45초. 주간 비교는 10/31 전후부터 의미 있음(수집 10/18 시작)
- 문제: 검색 유입 상위가 **무관한 사우디 처형 기사**(/vi 25명 이탈 96%, /ja 14명 이탈 100%, /fr 41명). news 중앙 체류 3초. 홈·가이드로 이어지는 흐름이 약함
- 좋은 신호: `rank_row_open` 2→11, `save` 6→14, `cheer` 8 — 랭킹·저장 사용 시작(표본 작음). 아이돌 연관 글(/ja 붕어빵·차은우 닮은 사장)은 이탈 40%

GA4 기준선(09-23~10-20): 활성 사용자 114, 재방문 4. 최근 30일 PV 129(10/19 기준) — **병목은 기능이 아니라 유입**. (docs/monetize/BM-VALIDATION.md, docs/decisions/app-2026-10-21.md)

## SEO / GEO

운영 기준 문서: docs/geo.md (SEO·AEO·GEO)
- 구현됨: AI·검색 크롤러 허용(`apps/web/src/app/robots.ts`), Organization·WebSite·NewsArticle·BreadcrumbList·FAQPage JSON-LD, 첫 문단 40~60단어 직답·질문형 소제목·표·FAQ 3개, hreflang, sitemap·뉴스 사이트맵·언어별 RSS, `/llms.txt`, IndexNow(발행 시 Bing·Naver·Yandex 통지), 도메인 이전 301.
- 10/22: Search Console 제품 스니펫 오류 수정(별점 없는 제품은 `Thing`, PR #4) — Search Console 은 연결돼 있다.
- 방향: **AI가 대신 답하기 어려운 페이지**(날짜·순위·예매·투표처럼 계속 바뀌는 것)에 집중. 근거 — AI 요약 시 1위 클릭률 -58%. (docs/PRD.md §8.1)
- 디스커버: `max-image-preview:large` + 글마다 1200px 이상 고유 16:9 이미지.
- 애드센스 승인 전략: 에버그린 가이드 30편 이상 먼저. (docs/keywords.md §4)
- 색인 확대 순서: ko → vi·id → fr·ru·zh-CN, 조건은 GSC 색인율 50% 초과.
- GEO 측정: `npm run worker -- geo-check 8`(Claude 웹 검색 답변 기준, 월 1회, 질문당 약 100원). 10/15 기준선: 대만 번체 AAA 질문은 인용 없음 = 빈자리.

## 키워드 (docs/keywords.md, docs/PRD.md §2)

- 시장 기회 순위: ① zh-TW 올리브영·피부과(대만에서 'olive young' 검색이 여행 검색의 3배) ② ja K-푸드·신오쿠보 ③ en K-푸드 제품(불닭·라면·편의점) ④ en K-뷰티 롱테일 ⑤ 반응 번역 ⑥ vi 유학 ⑦ 비자·K-ETA.
- 날짜 걸린 것: **11/20~21 MAMA 오사카(ja 최우선), 12/4 대만 워홀 마감, 12/5~6 AAA 가오슝, 12/31 K-ETA 면제 종료**.
- 롱테일 아이디어: 'best Korean sunscreen for oily skin'형 비교표(피부 타입별 1위·가격대·성분).
- 운영 방식: 8주 검증 루프 — 4주 뒤 상위 3칸(언어×카테고리)에 생산량 60%.

## 채널

- 검색이 1순위, SNS는 발견용. 언어별 SNS 1순위: ja = X·LINE / zh-TW = Threads·Facebook·LINE / en = X·Reddit(자기 링크 10% 이하)·Pinterest / vi·id = Facebook·TikTok / zh-CN = 샤오홍슈(인지도용). (docs/PRD.md §8.2)
- 숏폼은 발견용(링크 거의 안 먹힘). 직캠·방송 클립 재업로드 금지(인스타 2026-04-30부터 추천 제외). 포맷: 편의점·올리브영 신상 직접 촬영 / 컴백·시상식 30초 정리 / 외국인 Q&A.
- **실제 진행: SNS 계정 개설·운영 기록 없음.** Remotion 숏폼 템플릿도 설계만(docs/PRD-kakao.txt). 카카오 문서 2개는 내부 공유용 요약이지 채널 계획이 아님.
- 재방문 장치: 홈 설치 카드, 이메일 한 칸(앱 대기 명단 겸용, 10/21 구현), 공유 버튼(LINE·WhatsApp·Messenger·X·Threads), 컴백 D-day 캘린더, 저장함. 확인 메일·주간 뉴스레터는 Resend 가입 전이라 미완.
- 협찬: `/partners` 열려 있음. 대상 어학원·워홀 에이전시·외국인 부동산·K-뷰티·여행사·팝업스토어. 팔로워 1만 넘으면 영업 시작(가장 큰 매출 레버). (docs/revenue.md §5)
- 시상식 시즌 실시간 운영: KGMA 11/7–8, MMA 11/14–15, MAMA 오사카 11/20–21, 청룡 11/25, AAA 가오슝 12/5–6, 골든디스크 하노이 1/9–10.

## 측정

- PostHog 프로젝트 670566(쿠키 없는 모드 — 재방문·사람 수 불가), GA4 559398912(앱 착수 판단 지표는 GA4 기준).
- 행동 이벤트: `buy_box_view`·`affiliate_click`(제휴), `save`·`unsave`·`saved_view`·`saved_share`(저장), `feed_page`·`next_article_view`(이어 읽기), `guide_tile_open`·`guide_teaser_click`·`cross_rail_click`(가이드), `rank_row_open`·`cheer`(랭킹), `quiz_*`, `poll_vote`, `item_vote`, `reaction`, `share`, `comment_submit`, `visited_stamp`, 앱 수요 `install_*`·`app_installed`·`pwa_open`·`subscribe_*`.
- **내부 접속 제외**: 팀원은 각자 기기에서 `https://unnienote.app/?internal=1` 을 한 번 연다(그 브라우저는 PostHog 전송 안 함). 10/22 전 숫자의 Direct 유입(1인당 7~10쪽, 30쪽 넘는 세션)은 내부·봇이 섞여 있으니 빼고 볼 것.
- **아침 브리핑(자동)**: 매일 06:00 KST Paseo 일정이 저장소 밖 `~/Desktop/pro/unnienote-brief` 에서 `node brief.mjs` 로 어제·7일 숫자(유입 도메인·랜딩·언어·섹션·이벤트·새 글 수·main 커밋)를 모으고, 에이전트가 좋아진 점·나빠진 점·원인 추정(확신 표시)·개선 방향을 써서 사장님 애플 메모 '📈 언니노트 브리핑'에 올린다. 지난 브리핑은 그 폴더 `briefs/`. 팀 공유가 필요하면 그 글을 옮겨 쓴다(회사 슬랙으로 자동 전송은 하지 않음).
- 그 밖: Search Console, Bing Webmaster Tools AI Performance(등록 여부 미확인), 월 1회 `geo-check`, 4주마다 언어×카테고리 EPMV 보고(계획).

## 마일스톤

- **2026-11-20**: 색인율 50% 이상 확인. 30% 미만이면 URL 을 늘리지 않는다.
- **2027-01-13**: 검색 클릭 월 50 이상 또는 노출 월 5천 이상. 90일 목표(월 PV 5만, 월 검색 클릭 2만) 점검, 앱 착수 재검토.
(docs/research/validation-2026-10.md, docs/PRD.md §1)

## 남은 마케팅 과제

- 미확인·미완: Threads(zh-TW) 매일 운영, X(ja·en) 계정, Bing Webmaster Tools 등록, `INDEXNOW_KEY` 설정 확인, Cloudflare AI 봇 정책(쓴다면), 이메일 뉴스레터 발송(Resend), 개인정보처리방침에 이메일 항목.
- 광고 네트워크 확장 조건: 일본 트래픽 → fluct, 대만 → adGeek·ClickForce, 영어권 50%·월 2.5만 PV → Raptive.
- 법 고지: 제휴 링크가 든 메일은 `(광고)`(정보통신망법 50조), ja `広告`·`PR`, fr `Publicité`, en FTC 문구.
- 마케팅 문서 전체가 Hallyu Brief·hallyubrief.com 이름을 쓴다 → Unnie Note 기준으로 갱신, 브랜드 검색 점검도 새 이름으로.

## 바로 다음 단계

1. **zh-TW Threads 한 채널을 매일 운영**(10/19 검증의 '다음 주 1순위'). 소재: 올리브영·피부과 가이드, 시상식 시즌.
2. **11/7~12/6 시상식 이벤트 페이지**를 일정 전에 준비(특히 MAMA 오사카 ja, AAA 가오슝 zh-TW).
3. 검색 유입 상위 랜딩의 이탈 줄이기 — 무관 기사 정리(개발 1번)와, 이탈 낮은 글(아이돌 연관)의 하단 추천 구성을 /fr·/vi 뉴스 상세에 적용.
4. 매일 아침 브리핑의 '개선 방향'을 보고 하루 1~3개 실행.
