# 참여 심리·경쟁 서비스 벤치마크 (언니노트 광고·제휴 매출용)

조회일 2026-10-19. 근거 등급: **[확인]** 원문·공식 페이지를 직접 열어 확인 / **[2차]** 2차 기사·업체 블로그·검색 요약만 확인(수치는 참고용) / **[추정]** 조사원 해석. 출처 번호 S1~S25는 맨 아래.

## 0. 결론

- 경쟁 서비스의 공통 루프는 "랭킹·결과로 발견 → 내 것으로 저장 → 결과 카드 공유 → 갱신·마감으로 재방문"입니다. 저장이 가운데 고리입니다 [2차: S15, S16].
- 로그인 없이 되는 것이 가장 효과 큰 후보입니다. 기기 저장 하트, 퍼스널컬러·피부타입 테스트, 주간 순위 변동, 투표입니다. 이 사이트는 로그인을 하지 않기로 했고(PRD §12), cheer·polls·reactions·comments API, /rankings, RankingSnapshot(케이팝·배우·드라마·팬픽 차트)이 이미 있습니다 [확인: 레포].
- 심리 근거 중 점수가 높은 것은 진행 표시(엔다우먼트 진행·목표 근접)와 스트릭 연구입니다. 반대로 Zeigarnik "미완성 기억 우위"는 2025 메타분석에서 재현되지 않았습니다. "이어보기"는 쓰되 미완성 압박은 쓰지 않습니다 [2차 초록: S24~S27].
- 피할 것은 가짜 타이머·가짜 재고·제휴료로 정렬한 "독립 랭킹"·출처불명 후기·끊김 압박 알림입니다. 한국 전자상거래법 제21조의2는 2025-02-14 시행입니다 [2차: S30~S34].
- 우선 구현은 하트 저장함, 주간 순위 변동 배지, 퍼스널컬러 테스트, 어워드 투표입니다(5절).

## 1. 서비스별 참여 루프

| 서비스 | 발견 → 저장 → 공유 → 재방문 | 화면 패턴 | 등급 |
|---|---|---|---|
| 샤오홍슈 | 관심사 태그 피드·검색 → "수집(collect)" 폴더 저장(Pinterest 보드와 유사) → 후기 노트 공유 → 저장해 둔 것 다시 찾기. 여성 70% 안팎·하루 16회 실행 같은 수치는 업체 블로그 주장 | 이미지 카드 피드, 좋아요·수집·댓글 | [2차] S15, S16. 저장이 재방문을 만든다는 직접 데이터는 못 찾음 |
| 화해 | 부문별·피부타입별·고민별 주간 랭킹, 반기 어워드 → 리뷰 1,000만+ 확인 → 무료 체험·포인트 → 성분 분석 "마이 스킨 매치" | 부문별 1위 카드, 테마 어워드(신제품·비건·넥스트 뷰티·라이징·글로벌 픽), 비포/애프터 사진 | [확인] 어워드 구성 S1. [2차] 랭킹 분류 S3, 5~10월 데이터·어뷰징 알고리즘+수작업 검수 S2. 산식은 비공개, 찜·공유는 확인 불가 |
| 올리브영 | 랭킹·어워즈 → 이미지 중심 리뷰 → 탑리뷰어 계층(주 1,000명→2개월 2,000명, 상위 100명 월 4만원 포인트) → 리뷰어 팔로우·댓글 도입 | 사진 리뷰 우선 노출, 리뷰어 순위 | [확인] S4(2022년 자료). 랭킹 산식은 업체 블로그뿐 |
| 강남언니 외국인판(UNNI) | 가격·후기 → 13개 언어 자동번역 채팅 상담 → 예약. 영수증 인증 후기. "Unnie Guide"(2026-03 출시) 요청 1,600건·73개국·월 30% 증가·내외국인 동일가 | 가격 노출, 채팅, 오프라인 센터 | [확인] S6. [2차] S5, S7. 외국인판 랭킹·전후사진 화면은 확인 불가 |
| Creatrip | 동네 가이드·후기 → 투어·한복·사진관 예약 → 첫 예약 10% 쿠폰. 130만+ 여행자는 자기 보고, 예약 수수료 수익 구조는 2차 보도 | 지도·가이드, 예약 | [확인] S8 |
| Klook | 앱 전용 플래시딜, KlookCash 적립, 매일 룰렛·위시리스트 추첨(2024 생일 세일) | 딜 카드, 푸시 | [2차] S9. 가격 알림·카운트다운은 확인 불가 |
| 위버스 | 아티스트 글 → 실시간 번역 자막 LIVE → DM → Jelly(내부 화폐)·멤버십·샵. 2025 3분기 MAU 1,160만, 미국 1일 잔존 40% | 라이브, 구독 | [2차] S10, S11. 배지·컬렉션은 팬앱 사이트 주장뿐 |
| Soompi | 어워드 투표(24시간 라운드), Produce 48 예측 투표(공식 순위 무관 명시), 퀴즈 섹션 | 최신·인기·트렌딩 탭, 더보기 | [확인] 퀴즈 구조 S12. [2차] 투표 S13 |
| 버즈피드 퀴즈 | 정체성 결과 → 친구에게 공유. "결과가 자신에게 의미 있어야 바이럴"(편집 이사 발언), 한 퀴즈 4,100만 참여 주장 | 한 화면 한 문항, 결과 카드 | [2차] S14 |
| Pinterest | 검색 → 핀 저장 → 보드 → 나중 구매. 저장한 상품은 7배 더 구매(회사 주장), Gen Z가 월 이용자 40%+ | 보드, 추천 핀 | [2차] S15 |
| 16Personalities·퍼스널컬러·피부타입 테스트 | 질문 → 유형 라벨 → 공유 → 유형별 추천. 일본은 유튜버가 확산, 유형 해시태그(#イエベコスメ)로 쇼핑 | 유형 카드 | [2차] S17, S18 |

## 2. 장치별 심리 근거

| 심리 | 근거와 강도 | 적용 장치 |
|---|---|---|
| 가변 보상 | Eyal: 사냥·부족·자기 세 보상. Skinner 간헐 강화는 동물 실험. 앱 이용에서의 도파민 인과는 대중서 주장 [2차: S19, 약함] | "오늘의 픽", 신규 진입 순위 |
| 수집·소유(엔다우먼트) | 소유자가 파는 값이 사는 값보다 큼. 방법론 비판 있음 [2차: S20]. 디지털 저장함까지 확장은 [추정] | 하트 저장함, 컬렉션 |
| 사회적 증거 | Cialdini의 여섯 원칙 [2차: S21] | 투표 결과 퍼센트, 저장 수. 가짜면 다크패턴(4절) |
| 희소성·FOMO | FoMO는 SNS 이용 증가·낮은 웰빙과 상관 [2차 초록: S22] | 실제 마감만(투표 마감, 컴백 D-day, 시즌 어워드) |
| 자기 발견 | 정체성 호기심, 바넘 효과(Forer 1948). MBTI 재검사 시 39~76%가 다른 유형 [2차: S23, 약함] | 테스트 + "재미용" 고지 |
| 진행·완성 | 사전 2스탬프 카드 완료율 34% 대 19%(현장실험 1건) [2차: S24]. 목표에 가까울수록 구매 가속 [2차: S25]. Zeigarnik 기억 우위는 2025 메타분석에서 재현 실패, 중단 과제 재개 경향만 확인 [2차 초록: S26] | 진행 막대, 이어보기 |
| 상호성 | 먼저 가치를 주면 보답 압력 [2차: S21] | 결과 리포트·체크리스트를 먼저 주고 공유·구독은 그다음 |
| 스트릭 | 이어진 스트릭 강조는 참여 증가, 끊김 알림은 역효과, 복구 가능하면 효과 약화 [2차 초록: S27]. 죄책감 알림 비판 [2차: S28] | 쓰더라도 "이번 주 n개 봤어요"처럼 끊김 없는 누적 |

## 3. 익명 가능 대 로그인 필요

| 구분 | 장치 |
|---|---|
| 익명 가능 (기기 localStorage + 서버 집계) | 하트·저장함, 테스트와 결과 URL 공유, 투표(기기당 1표. 완전 방지는 불가라 순위 반영은 참고용), 반응 칩, 진행 표시, 내 타입 필터, 최근 본, 이메일 뉴스레터, 웹푸시(iOS는 홈 화면에 설치한 웹앱만 가능) [2차: S29] |
| 로그인 필요 | 기기 간 동기화, 포인트·등급·리뷰어 계층, 자유 글 리뷰(스팸·의료광고 책임), 중복 투표 확실 방지, 팔로우·DM |

주의: 기기 저장은 지우면 사라집니다. "저장함 링크로 복원"을 제공합니다. localStorage의 EU 쿠키 규정상 지위는 [추정]이므로 법무 확인이 필요합니다.

## 4. 다크패턴 (피할 것)

| 패턴 | 근거 | 우리 규칙 |
|---|---|---|
| 가짜 카운트다운 | 쇼핑몰 1.1만 곳 조사에서 393건, 타이머가 끝나도 할인이 유지된 사례 확인 [확인: S30]. FTC 2022 "허위 믿음 유도" [2차: S31] | 실제 마감일이 있는 것만 표시 |
| 가짜 재고·인기 알림 | 재고 부족 문구 632건, 활동 알림 313건(허위 사례 포함) [확인: S30] | 실제 집계만 노출 |
| 제휴료로 정렬한 "독립 랭킹" | FTC가 든 사례: 독립 순위라 해놓고 보상 순으로 정렬 [2차: S31] | 산식 공개(/rankings/methodology), 제휴 링크 표시 |
| 가짜·출처불명 후기, 임의 전후사진 | 출처불명 후기 12건 [확인: S30]. 화해는 어뷰징 검수, UNNI는 영수증 인증 | 자체 후기를 지어내지 않고, 칩·투표만 둡니다 |
| 확인 수치심 문구(confirmshaming) | 169건 [확인: S30] | 거절 버튼은 중립 문구 |
| 끊김 압박·죄책감 알림 | 위 스트릭 연구 | 알림은 주 1~2회, 끄기 쉽게 |
| 광고 유도형 배치 | AdSense: 다음·이전 버튼, 게임·답안 창 근처 광고는 오클릭 위험, 위반 통보 가능 [2차: S32] | 답안·다음 버튼 주변에 광고 금지 |

한국 전자상거래법 제21조의2(2025-02-14 시행)는 숨은 갱신 등 결제 관련 유형이 중심입니다. 이 사이트는 결제가 없어 직접 해당은 낮지만, "마감 임박" 문구에 근거가 없으면 문제가 됩니다 [2차: S33, S34].

## 5. 광고와 충돌하지 않는 기능 15개 (우선순위 순)

난이도 1(쉬움)~5(어려움). 효과는 모두 [추정]이며 측정 후 교정합니다. 로그인은 전부 불필요합니다(14번 푸시는 설치 필요).

| 순 | 기능 | 기대는 심리 | 난이도 | 예상 효과 | 필요 데이터 |
|---|---|---|---|---|---|
| 1 | 하트 저장 + 저장함 탭(제품·병원·장소·아이돌) | 소유, 수집 | 1 | 재방문, 저장함 PV | 항목 ID, localStorage |
| 2 | 주간 순위 변동·신규 진입 배지, 실제 갱신 시각 | 가변 보상, 사회적 증거 | 2 | 랭킹 재방문, 체류 | 뷰티·병원 차트를 RankingSnapshot에 추가(RankChange 컴포넌트 재사용) |
| 3 | 퍼스널컬러·피부타입 테스트(문항 5~8개, 결과마다 고유 URL, 유형별 랭킹 연결) | 자기 발견, 상호성 | 3 | 유입·공유 최대, 결과에서 랭킹으로 PV 2~3배 | 유형 8~12개 규칙, 제품 톤·피부 태그 |
| 4 | 어워드·컴백 투표/예측(하루 1표, 즉시 퍼센트) | 사회적 증거, 실제 희소성 | 2 | 투표 후 결과·관련글 이동 | 후보 목록, 마감일(기존 polls) |
| 5 | 결과·랭킹·저장함 공유 카드 이미지 | 정체성 표현 | 3 | 외부 유입 | OG 이미지 생성(기존 opengraph-image) |
| 6 | 내 타입 필터 랭킹("나와 같은 타입") | 자기 발견, 개인화 | 3 | 랭킹 체류, 제휴 클릭 | 3번 결과 저장, 제품 태그 |
| 7 | 이어보기 + 진행 막대("베스트 20 중 7개 봤어요") | 엔다우먼트 진행, 목표 근접 | 2 | 세션당 PV | 방문 기록(기기) |
| 8 | 테마 큐레이션(루틴 키트·가격대별·상황별 리스트) | 수집, 상호성 | 1 | 내부 링크 PV | 콘텐츠 태그 |
| 9 | 반응 칩(보습력·순함 등 탭 한 번) | 사회적 증거 | 2 | 상호작용, 상세 체류 | 칩 목록(기존 reactions 확장) |
| 10 | 비교 보기(제품·병원 가격 2~3개 나란히) | 결정 지원 | 3 | 제휴 클릭, 체류 | 항목별 속성 표 |
| 11 | 입덕·성향 퀴즈(어떤 멤버·캐릭터 유형) | 자기 발견 | 2 | 케이팝·드라마 유입, 공유 | 아이돌·작품 데이터(기존 idol) |
| 12 | 시술 가격표·방문 전 체크리스트 저장 | 상호성, 완성 | 3 | 피부과·치과 체류, 제휴 | 공식 가격·절차 자료, 의료법 검토 |
| 13 | 여행 동선 담기(장소 저장 → 목록·공유 링크) | 수집, 계획 | 4 | 여행 PV, 예약 제휴 | 장소 좌표, Klook·Creatrip 링크 |
| 14 | 일정 알림(컴백·방영·세일) 웹푸시 | 실제 희소성 | 3 | 재방문 | 일정(기존 schedule), 구독 토큰 |
| 15 | 주간 이메일 "저장함 변동 요약" | 상호성, 가변 보상 | 3 | 재방문 | 이메일 동의 |

**광고 충돌 방지 규칙**
- 문항은 한 화면에서 단계 전환, 결과는 고유 URL로 둡니다. 결과에서 추천 랭킹으로 이동시켜 PV를 늘립니다. 문항마다 페이지를 쪼개 PV를 억지로 늘리지 않습니다.
- 답안·다음 버튼 주변에 광고를 두지 않고, 문항 사이에 전면 광고를 넣지 않습니다. 결과 페이지에 광고 1~2개만 둡니다 [2차: S32].
- 광고 영역 높이를 미리 확보해 레이아웃 흔들림을 막습니다 [추정].
- 측정은 PostHog(쿠키 없음)로 저장 수, 7일 재방문율, 세션당 PV를 봅니다 [추정].

## 6. 한계

- 못 찾은 것: 화해·올리브영 랭킹 산식, 화해 찜·공유 기능, UNNI 외국인판 랭킹·전후사진, Klook 위시리스트·가격 알림, 샤오홍슈 수집의 재방문 기여 수치.
- UNNI 보도자료(S5)는 열리지 않아(HTTP 403) 검색 요약으로 확인했고, WebKit 원문(S29)도 직접 열지 못했습니다.
- 올리브영 자료는 2022년 것이라 현재 제도와 다를 수 있습니다.
- 전환 수치는 업체·회사 주장이 많아 방향성으로만 읽습니다.

## 출처

- S1 https://www.hwahae.co.kr/awards/home
- S2 https://www.venturesquare.net/1015149/ , https://byline.network/2026/03/09_hwahae/
- S3 https://apps.apple.com/KR/app/id940056100 (화해 랭킹 구성)
- S4 https://cjnews.cj.net/%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81-%EB%A6%AC%EB%B7%B0-%EC%BD%98%ED%85%90%EC%B8%A0-%EA%B0%95%ED%99%94%EB%A1%9C-%EC%BB%A4%EB%AE%A4%EB%8B%88%ED%8B%B0-%EC%BB%A4%EB%A8%B8%EC%8A%A4
- S5 https://www.businesswire.com/news/home/20231205938563/en/The-Largest-Plastic-Surgery-Information-Platform-in-South-Korea-Launches-UNNI-a-Global-K-Medical-Information-App-for-Foreigners
- S6 https://view.asiae.co.kr/en/article/2026081015454591567
- S7 https://cm.asiae.co.kr/en/article/2021061008500207045 (영수증 인증)
- S8 https://apps.apple.com/us/app/creatrip-korea-your-way/id1221245620
- S9 https://ttrweekly.com/site/2024/10/klook-lines-up-birthday-deals , https://discover.shopback.com/stores/klook , https://blog.wego.com/klook-promo-code/
- S10 https://foxdata.com/en/blogs/weverse-unpacking-the-product-logic-and-global-strategy-behind-kpops-worldwide-expansion/
- S11 https://magazine.weverse.io/article/view/1734?lang=en
- S12 https://www.soompi.com/category/quizzes
- S13 https://www.soompi.com/produce-48-vote/ , https://www.soompi.com/article/563105wpp/vote-soompi-awards-2013
- S14 https://www.ksl.com/article/28826901/which-blank-are-you-online-quizzes-go-viral , https://docs.rwu.edu/communication_theses/1
- S15 https://www.socialmediatoday.com/news/pinterest-shares-report-gen-z-user-trends/716769/ , https://oneday.agency/blog/how-gen-z-is-active-on-pinterest
- S16 https://www.oom.com.sg/what-is-xiaohongshu-rednote/ , https://foxdata.com/en/blogs/rednote-from-a-content-consumption-platform-to-an-interestdriven-resonance-space
- S17 https://tokyoesque.com/growing-trend-personalised-beauty-in-japan-2022/
- S18 https://www.sportskeeda.com/lifestyle/is-personal-color-analysis-new-k-beauty-trend-everything-theory-know-go-to-shades
- S19 https://www.nirandfar.com/2012/03want-to-hook-your-users-drive-them-crazy.html
- S20 https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Behavioral_Decision_Theory/Kahneman_et_al_1990_Experimental_tests.pdf
- S21 https://fs.blog/influence-psychology-persuasion/
- S22 https://selfdeterminationtheory.org/wp-content/uploads/2014/04/2013_PrzybylskiMurayamaDeHaanGladwell_CIHB.pdf
- S23 https://cortecs.org/wp-content/uploads/2014/12/the-barnum-effect-in-personality-assessment-a-review-of-the-literature.pdf (바넘), https://biologyinsights.com/is-16-personalities-accurate-what-the-science-says/ (MBTI 재검사, 일반 기사라 약함)
- S24 https://knowledge.wharton.upenn.edu/?p=5630
- S25 https://business.columbia.edu/sites/default/files-efs/pubfiles/1200/goalgradient.pdf
- S26 https://ideas.repec.org/a/pal/palcom/v12y2025i1d10.1057_s41599-025-05000-w.html
- S27 https://udspace.udel.edu/items/42ce576b-8e1f-429a-8541-e29e48dbcfbb
- S28 https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification
- S29 https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados , https://9to5mac.com/2023/02/16/iphone-web-app-new-features-ios-16-4/
- S30 https://webtransparency.cs.princeton.edu/dark-patterns
- S31 https://www.huntonprivacyblog.com/2022/09/27/ftc-releases-report-on-dark-patterns/
- S32 https://support.google.com/adsense/answer/48182
- S33 https://www.lawtalk.co.kr/posts/131447
- S34 https://www.yulchon.com/en/resources/publications/newsletter-view/41347/page.do
