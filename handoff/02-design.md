# 02. 디자인

## 현행 기준 = 2026-10-20 홈·색 개편

사장님 피드백("컬러 구리다, 그래픽·아이콘이 없다, 가이드를 키워라, 광고 넣어라")을 반영한 개편이 현행이다. (docs/design/REFRESH-2026-10-20.md)
`docs/design/README.md` 의 10/15 시안 3종(SHIMEN·RISO·BOARD)은 **역사 기록** — 지금 화면과 다르다.

### 색
- 면은 **흰색(`--bg`)과 회색(`--band` #f4f4f6) 둘뿐**. 파스텔 틴트·그라데이션·마스킹테이프·노트 줄은 없앴다. `--tint-*` 토큰은 이름만 남고 값은 `var(--band)`.
- 브랜드색은 **핫핑크 하나**: 버튼·선택 `--brand` #e0137a(흰 글자 대비 4.6:1), 점·포인트 `--cherry` #ff2488, 링크 `--brand-ink` #d1106e(다크 #ff6fb1).
- 핑크 블록은 **행동(버튼)과 임박(7일 안 일정)** 에만.
- 다크 모드 있음(`--bg` #111113). 토큰 정의: `apps/web/src/app/globals.css`

### 글꼴
- 웹폰트 없이 시스템 서체(-apple-system, SF Pro Text, Segoe UI, Roboto, Hiragino, PingFang TC, Apple SD Gothic Neo, Noto Sans JP/TC/KR).
- 라틴 서체를 한중일 서체보다 앞에 둔다(러시아어 자간·베트남어 성조 문제).
- 로고(`.wordmark`)만 `--font-instrument`(Georgia 폴백).
- CJK 줄바꿈: 서버에서 budoux 로 끊음. ko·ja·zh 밖에서는 `keep-all` 빼기. 일본어 금칙 검증 docs/predeploy/verify-kinsoku-webkit.md

### 아이콘·이미지
- **Microsoft Fluent Emoji 3D(MIT)**, 160px PNG + WebP(약 4KB). 매핑 `apps/web/src/data/icons3d.ts`, 추가 `node apps/web/scripts/icons3d-fetch.mjs`.
- 가이드 커버 규칙은 `src/data/cover.ts` 한 곳, 그리는 컴포넌트 `components/guide/CoverArt.tsx` 하나.
  - 제품·드라마·클리닉 = 3D 아이콘, 여행 명소·동네 = 위키미디어 공용 CC 사진(`apps/web/scripts/commons-photo.mjs`).
  - 뷰티 제품 실사진은 Open Beauty Facts CC 사진만.
- **저작물(제품 공식 사진·포스터·병원 사진) 쓰지 않음.** 위치가 불확실한 사진도 넣지 않음.

### 컴포넌트 규칙 (docs/monetize/DESIGN.md)
- 기존 `ListRow`, `SectionHeader`, `Badge`, `Button`, `BottomSheet`, `toast`, 알약 칩을 재사용한다. **새 글자 크기·새 색 임의 추가 금지** — `lint-tokens --strict`(웹 `npm run lint`) 통과해야 한다.
- 순위·별점·투표 % 같은 **숫자가 화면에서 가장 큰 글자**.
- 화면마다 색은 "섹션 틴트 1 + 브랜드 1 + 잉크". 메달 금·은·동, 다색 막대 쓰지 않음.

## 화면 원칙

- **모바일 우선, 아이폰 390×844 기준.** 캡처 `node scripts/screens.mjs [URL] [폴더]`.
- 하단 탭(풀폭, 10/20 기준 5개): 홈·랭킹·가이드·일정·저장. 선택은 검정, 나머지 회색(핑크 아님). 글·일정 상세에서는 탭바 숨김. (10/19 문서에는 4탭으로 적혀 있음 — 최종은 코드 확인)
- **홈(10/22 PR #5부터)**: 첫 화면이 '오늘' — 날짜 줄·내 최애·오늘의 탑 기사·오늘의 한 표. 그 아래 카테고리 메뉴·가이드 카드·많이 읽는 기사·이어 읽기·일정·랭킹·최신 피드 순(10/20 이후 여러 번 재배열 — 정확한 순서는 `apps/web/src/components/home/`).
- **피드에는 3장 간격으로 모듈 삽입**: 가이드 소개 → 팬 투표 → 광고 → 차트 → 여행 가이드 → 광고.
- **참여 UI(10/22 PR #1)**: 실시간 인기, 최근 댓글, 결과 공유 카드, 댓글 공감.
- 404·오류 화면도 앱 헤더·하단 탭·9개 언어로 DB 없이 그린다.

### 광고 배치 규칙
- 첫 화면과 버튼 있는 모듈 바로 옆에는 두지 않는다.
- 자동 광고의 앵커(하단 고정) 끔 — 탭바와 겹침.
- 슬롯 환경변수가 없으면 운영에서 광고 자리를 그리지 않는다. 애드센스 승인 전 대체 배너는 피부 진단(`quiz/QuizBanner`).
- 제휴에는 "PR/広告" 표기와 고지 문구(일본 스텔스 마케팅 규제). Save-Data 모드면 광고를 받지 않는다.

### 앱(웹뷰) 모드
- 앱에서는 댓글 진입점·시술(`/clinic`) 진입점·이메일 칸을 숨기고, 시술은 사파리 창으로 연다. (docs/decisions/app-2026-10-21.md)

## 디자인 문서 지도

| 문서 | 내용 |
|---|---|
| docs/design/REFRESH-2026-10-20.md | **현행 기준** |
| docs/monetize/DESIGN.md | 가이드 섹션 기준서(케이아지트 해부, 원칙·토큰). 일부(유령 글자 커버)는 폐기 |
| docs/design/README.md + direction-1~3, refs-v1~v3, screens/ | 10/15 시안 3종 비교(역사 기록) |
| docs/monetize/REVIEW-LEFT.md | 디자인·접근성·법 검수표("남음"·"고침") |
| docs/predeploy/verify-*.md, shots/ | 화면별 검증 기록과 캡처 |
| docs/research/personas-2026-10-20/ | 가상 사용자 21명 반응 |

## 남은 디자인 과제

1. **REVIEW-LEFT "남음"**
   - 접근성: 토스트 안 버튼 키보드 도달, 저장함 삭제 뒤 포커스 유실, 시술 체크리스트 테두리 대비 1.48:1, 가로 레일 포커스 링 잘림.
   - 구조: 광고 띠 4벌 복제(클리닉 3화면은 숨김 규칙이 빠져 빈 띠가 보임), 지역표 2벌, 제휴 고지 줄 2벌 → 하나로.
   - 저장함 빈 상태에서 푸터가 너무 큼.
2. **애드센스 승인 뒤** 광고 자리 실제 노출 확인(대체 배너 교체).
3. **일반 기사 OG 이미지**: 글마다 1200px 이상 고유 16:9가 디스커버 요건(공통 OG 금지). 피부 진단 결과 OG 만 구현됨.
4. **앱 심사 대응**: Apple 4.2 대응 기능(저장한 일정 D-1 로컬 알림 등)과 설정 화면(언어·알림) 디자인.
5. 숫자·타임라인 중심 기사 구조(`keyNumbers[]`·`timeline[]`) 반영 여부 미확인.
