# 레퍼런스 캡처 v3 — 가이드 섹션(뷰티·여행·클리닉·드라마·저장) 용 (2026-10-19)

- 기기: iPhone 15 (393×852, 2배, Chromium, iOS Safari UA). 파일 `<사이트>-<n>.jpg` 의 n = 1 첫 화면, 2 = 852px 스크롤, 3 = 1704px 스크롤.
- `sheet-0N-*.jpg` = 6장을 3×2 로 묶은 대조표(1배). 빠르게 보려면 이것부터.
- 다시 찍기: `node docs/design/refs-v3/capture.mjs` → `node docs/design/refs-v3/sheet.mjs` (저장소 루트에서).
- 화면을 덮는 모달·전면 광고는 스크립트가 지웠다. 앱 설치 배너·쿠폰 띠는 디자인 판단 대상이라 그대로 뒀다.
- 분석과 적용은 `docs/monetize/DESIGN.md` §2.

| 이름 | 주소 | 상태 | 본 것 |
|---|---|---|---|
| kagit-home | https://kagit.kr/ | ok | 언어 제안 바, 번호 알약 헤드라인, 急上升 칩 레일, 한 열 큰 사진 카드, 피드 안 광고, 탭 5 |
| kagit-ranking | https://kagit.kr/rankings | ok | 랭킹 허브: 틴트 정사각 아이콘 카드 7장, 準備中 노출 |
| kagit-article | https://kagit.kr/rankings/k-pop | ok | 차트: 출처 칩·가중치 %·5색 누적 막대·점수 뱃지·1위 공유 카드 |
| oliveyoung-global-home / -best | https://global.oliveyoung.com/ , /display/page/best-seller | ok | 2열 3:4 제품 카드, 좌상단 검정 순위 사각, 알약 분류 칩(선택 검정), ★4.8, 쿠폰 띠 |
| lemon8-beauty-jp / lemon8-home | https://www.lemon8-app.com/discover/beauty?region=jp | ok(하단 앱 벽) | 顔型診断(테스트가 콘텐츠), "128人が保存しました"·♡·💬, 관련 검색 칩 격자 |
| xiaohongshu-explore | https://www.xiaohongshu.com/explore | 캡차(安全验证) | 참고 불가 |
| creatrip-home | https://www.creatrip.com/zh | ok | 2열 상품 카드, 하트 우상단, 人氣商品 뱃지, ★4.9 (1,215), 순위 사각 목록 |
| klook-seoul | https://www.klook.com/zh-TW/city/13-seoul-things-to-do/ | 403 차단 | 참고 불가 |
| weverse-home | https://weverse.io/ | ok | 다크 히어로 카드 "01 / 10", 아바타+이름 알약 칩 레일 |
| zigzag-home | https://zigzag.kr/ | ok | 앱 배너, 2열 3:4, 하트 우하단, 태그 좌하단, 36% 가격, 찜 탭 |
| 29cm-home | https://www.29cm.co.kr/ | ok | 에디토리얼 블록(큰 사진 → 제목 → 한 줄 → 제품 줄 3개, 하트 아래 수) |
| hwahae-home / -rankings | https://www.hwahae.co.kr/ , /rankings | ok | 1위 히어로 1/10, 메달 1~3 + 숫자 4~, 변동 ▲▼, NEW, 피부 타입 칩 개인화 랭킹, 갱신 날짜 |
| glowpick-home | https://www.glowpick.com/ | ok | 앱 배너, 아이콘 격자, #카테고리 Top 10 가로 레일(순위 사각) |
| mydramalist-home | https://mydramalist.com/ | ok | 파란 헤더, 영상 광고, 에디토리얼 카드 ♡17 💬9, 썸네일 목록, 하단 고정 광고 |
| musinsa-ranking | https://www.musinsa.com/main/musinsa/ranking | ok | 일간 1위 날짜 띠, 필터 칩, 3열 카드, 급상승 태그, "131명이 보는 중", 하단 떠 있는 세그먼트 |
