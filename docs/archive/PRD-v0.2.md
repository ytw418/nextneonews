# Hallyu Brief (가칭) — 다국어 K-컬처 이슈 미디어 PRD

> v0.2 · 2026-10-14 · 작성: 성준 · 상태: 초안 (동생 리뷰 요청)
> 사실관계는 2026-10-14 기준 웹 조사 결과다. 출처는 부록에 있고, 공식 문서로 확인하지 못한 것은 **(미확인)**으로 표시했다.
> 키워드와 주제 시드는 [`keywords.md`](./keywords.md)에 있다.

---

## 0. 한 줄 요약

네이버, 커뮤니티, 헬로톡에서 한국 이슈와 외국인이 묻는 질문을 직접 수집한다. AI가 이를 **새 글로 쓰고 5~6개 언어로 현지화**해서 **웹과 숏폼 SNS에 동시에 배포**한다. 수익은 광고, 제휴, 브랜드 협찬으로 낸다.

---

## 1. 벤치마크: 케이아지트 (kagit.kr)

2026-10-14에 직접 확인한 내용이다. 우리가 하려는 모델이 이미 돌아가고 있다.

| 항목 | 케이아지트 |
|---|---|
| 언어 | 번체 중국어 중심 + en / ja / ko / zh / th |
| 카테고리 | K-Pop, K-Drama, K-Beauty, K-Food, K-Travel, K-Style, K-Biz, K-Medi, 랭킹, 크리에이터(K-網紅) 디렉토리 |
| 콘텐츠 | `韓娛熱議-…` 같은 커뮤니티 반응형 글, 열애설·계약 루머 기사, 시청률, K-food 이슈 |
| 기술 | Next.js |
| 광고 | **AdSense + adGeek(대만 광고 대행사)의 헤더비딩** (ads.txt 약 2,900줄). Amazon, Criteo, Rubicon, PubMatic 등이 경쟁 입찰한다 |
| 그 밖의 수익 | 브랜드·크리에이터 B2B (brands@, creators@ 창구, 企業服務, 品牌洽詢) |
| 인터넷신문 등록 | 사이트에 등록번호 표시 없음 |
| 신뢰 장치 | Editorial Policy, Corrections, Terms, Privacy 페이지 |

**우리의 차별점**
- 케이아지트는 연예 중심이다. 우리는 **워홀·알바·집·생활 정보**를 더한다. 검색 유입이 길게 가고 제휴 단가도 높은 영역이다.
- 숏폼 자동화로 SNS 유입을 만든다.
- 처음부터 **일본어와 영어**를 같이 간다. MAMA가 오사카, aespa 투어가 유럽이다.

---

## 2. 이전 시도(NeoNews)에서 배운 것과 돌파 방법

이전에는 Playwright로 네이버를 크롤링하고 AI로 글을 만들어 AdSense와 쿠팡을 붙였다. 사실상 복붙이어서 광고가 제한됐다. 이번에는 아래처럼 바꾼다.

| 막혔던 것 / 막힐 것 | 돌파 방법 |
|---|---|
| 복붙 콘텐츠 → 광고 제한 | 사실만 뽑아 **새로 쓰고**, 원문에 없는 **"외국인이라면" 정보**(해외 예매법, 교통, 비자)를 더한다. 사실은 저작권 대상이 아니다 |
| 애드센스 심사 | **가이드형 에버그린 글 30편으로 먼저 승인**을 받는다 (keywords.md 4장). 그 뒤 이슈형 물량을 늘린다 |
| 구글이 AI 대량생성·자동번역을 스팸으로 봄 | 언어별 **현지화**: 나라별 워홀 조건, 통화, 팬덤 용어. 품질이 낮은 번역 페이지는 noindex |
| 네이버 API 약관(AI 입력·광고 수익 금지) | **API를 안 쓰고 직접 수집**한다 (5.1) |
| 아이돌 사진 저작권·초상권 | 공식 SNS 임베드, 소속사 공식 이미지에 크레딧, 자동 텍스트카드 썸네일 (5.4) |
| 숏폼 수익화 정책 (템플릿 반복 AI 영상 제한) | 포맷 3~4종을 돌리고 직접 찍은 소스를 섞는다. 수익화가 막혀도 **사이트로 보내는 유입 통로**로 쓴다 |
| TikTok·샤오홍슈 API 제한 | 이미 감사를 통과한 업로드 대행 API를 쓰거나, 자동으로 만든 "업로드 팩"을 폰에서 하루 5분 동안 올린다 (8.3) |
| Vercel 무료플랜은 광고 금지 | Cloudflare Workers(무료·$5)를 쓰거나 Vercel Pro $20 |

---

## 3. 목표

- **1개월**: MVP 오픈. 3개 언어(en, ja, zh-TW), 3개 카테고리, 하루 5~10편, 반자동.
- **2~3개월**: 애드센스 승인, 숏폼 채널 3~4개 자동 업로드, 하루 20~30편.
- **6개월**: 월 10만 PV, 대만 트래픽이 붙으면 adGeek 같은 대행사로 단가를 올린다.

**안 하는 것**
- 로그인·회원, 앱
- 중국 본토용 웹 (접속이 불안정하고 애드센스도 안 뜬다). 중국은 샤오홍슈로 간다.
- 실존 아이돌 실사 합성

---

## 4. 콘텐츠

### 4.1 카테고리
- **Phase 1**
  - K-pop·연예 (일정, 티켓팅, 이슈, 반응)
  - K-food·편의점
  - 워홀·알바
- **Phase 2**
  - K-드라마·촬영지
  - 여행·축제
  - 생활 앱·통신·은행
- **Phase 3**
  - 집·부동산 (월세·전세·보증금)

### 4.2 포맷

| 포맷 | 예 | 역할 |
|---|---|---|
| 이슈형 | "IVE·ILLIT·RIIZE 10/26 컴백 3파전 정리" | 속도, SNS 유입 |
| **네티즌 반응형** | "○○ 열애 보도에 한국 네티즌 반응" (케이아지트 `韓娛熱議` 방식) | 해외 팬이 가장 궁금해한다. 한국어 장벽이라는 우리의 해자 |
| Q&A형 | "MAMA 2026 오사카 티켓·라인업·생중계 보는 법" | 검색 유입 |
| 가이드형 | "한국 번호 없이 K-pop 티켓 사는 법", "대만인 한국 워홀 A to Z" | 애드센스 승인, 오래가는 검색 유입, 제휴 |
| 리스트형 | "편의점 신상 TOP 10", "불닭 맵기 순위" | SNS·숏폼 |

**네티즌 반응형 작성법**
- 원글을 요약하고, 댓글은 3~5개를 한두 줄씩 짧게 인용한다.
- 우리 해설과 맥락을 붙인다. 해외 팬이 모르는 배경을 설명한다.
- 작성자 닉네임은 가린다.

### 4.3 민감 주제 기준 (막지 말고 이렇게 쓴다)

| 등급 | 대상 | 처리 |
|---|---|---|
| 🟢 자동 발행 | 음식, 여행, 생활, 공식 일정, 시상식 라인업 | 출처 링크만 있으면 된다 |
| 🟡 사람 승인 | 열애설, 계약 분쟁, 논란, 비자·금액 정보 | **이미 기사가 난 것만** "~라는 보도"로 쓰고 반응을 정리한다. 단정하지 않는다 |
| 🔴 쓰지 않음 | 기사 없이 커뮤니티에만 도는 찌라시, 사망·범죄 피해자, 미성년 선정성, 정치 | 주제 선정 단계에서 버린다 |

**할루시네이션 방지**
- 날짜, 가격, 장소, 시청률 같은 숫자는 **출처에서 추출한 값만** 쓴다.
- 출처와 맞지 않는 문장은 검사 단계에서 삭제한다.

### 4.4 글마다 들어가는 것 (원본성 = 광고가 안 막히는 조건)
- 출처 링크 1개 이상
- **"외국인이라면" 섹션**: 해외 예매, 결제, 교통, 비자, 환율 환산 등
- FAQ 3개 (구조화 데이터)
- 원문 문장 복사 없음 (유사도 검사)
- 하단 고지: "AI의 도움으로 작성·번역했고 편집자가 검수했습니다" + 정정 요청 링크

### 4.5 언어
- **Phase 1**: en, ja, zh-TW (+ ko 원본)
  - 근거: MAMA 오사카(ja), AAA·BTS 가오슝과 대만 워홀(zh-TW), aespa 유럽(en)
- **Phase 2**: zh-CN (샤오홍슈), th, es
- **현지화 원칙**
  - 일본어 팬덤 용어(推し, ソウルコン)를 쓴다.
  - 번체와 간체를 분리한다.
  - 통화를 환산한다.
  - 나라별 워홀 조건을 따로 쓴다.

### 4.6 숏폼
- **주제**: 동생이 말한 "뇌 빼고 보는 영상"을 기본으로 한다. 편의점 조합, 서울 명소, 생활 꿀팁, 이번 주 컴백, 시상식 라인업.
- **포맷**: 3~4종을 돌려 쓴다. 정보 카드형, 랭킹형, Q&A형, 지도·동선형.
- **직접 찍은 소스를 20% 이상 섞는다.** 편의점 신상이나 거리 촬영 등이고, 성준이 맡는다.
- **길이**: 30~45초가 기본이다. TikTok 수익화를 노리는 시리즈는 1분 이상으로 만든다.
- **유입 통로**: 영상 수익화와 관계없이 프로필 링크와 고정 댓글로 사이트에 유입시킨다.

---

## 5. 파이프라인

> 단계별 제작 사양(품질 체크, 웹 글, 숏폼, X 수집)은 [`production.md`](./production.md)에 있다.

```
[직접 수집] → [품질 체크] → [주제 선정] → [사실 추출] → [초안 작성] → [자동 검사] → [승인(🟡만)]
     ↑                                                                   ↓
[성과 수집] ← [SNS 배포] ← [숏폼 생성] ← [웹 발행] ← [이미지] ← [현지화]
```

### 5.1 직접 수집 — API를 안 쓴다

**원칙**
- **제목, 링크, 반응 수(조회·댓글·추천)**를 주제 신호로 저장한다.
- 본문은 사실을 뽑을 때만 읽고, 원문 그대로 재게시하지 않는다.

| 소스 | 방법 | 주기 | 뽑는 것 |
|---|---|---|---|
| **X(트위터) 공식 계정·키워드 급상승** | 공식 API 종량제 (읽기 1건 $0.005). 공식 계정 50개 타임라인 + 키워드 20개 언급량 | 1~3시간 | 공지, 급상승 키워드 (가장 빠른 소스). 월 상한 $50~100 |
| 네이버 연예 랭킹·많이 본 뉴스 | 화면이 쓰는 JSON을 직접 요청 (✅ 구현됨) | 1시간 | 제목, 링크, 순위, 조회 수 |
| 네이트판 톡커들의 선택 (✅ 구현됨), 더쿠 HOT, 인스티즈 | fetch + HTML 파싱 | 1시간 | 제목, 조회·댓글·추천 수 → 반응형 후보 |
| **네이버 카페** (워홀·유학·외국인·팬카페) | **서브 네이버 계정으로 로그인한 세션**에서 Playwright로 가입한 카페 게시판 목록 수집 | 3~6시간, 천천히 | "언제·어떻게·얼마·외국인"이 들어간 질문글 제목 |
| **헬로톡** (앱 전용) | 안드로이드 에뮬레이터에서 Moments를 'Korea / 韓国 / 韓國 / 韩国'로 검색하고 스크롤하며 캡처(ADB) → Claude 비전으로 질문 추출 | 하루 1번 | 외국인이 실제로 묻는 질문 |
| 일본 知恵袋, 대만 Dcard·PTT, 샤오홍슈, Reddit | 검색 결과 페이지, Reddit은 서브레딧 RSS | 하루 1~2번 | 질문 제목 |
| 경쟁 사이트 (케이아지트, Soompi, Koreaboo, allkpop) | 목록 페이지 / RSS | 1시간 | 우리가 아직 안 쓴 주제 |
| 공식 일정 (소속사·티켓사 공지, KOPIS 공연DB, 대사관 워홀 공지, 고용부·법무부) | fetch | 하루 1번 | 날짜, 장소, 가격 등 **사실 출처** |
| 위키 페이지뷰, 구글 트렌드 | fetch | 하루 1번 | 나라별 관심 급등 |

**운영 수칙** (차단·분쟁 줄이기)
- 사이트별로 요청 간격을 두고, 차단되면 그 소스의 수집 주기를 늘린다.
- 로그인이 필요한 곳은 **서브 계정**으로 한다. 본 계정·브리디 계정과 분리한다.
- 원문 본문과 이미지는 재게시하지 않는다. 댓글 인용은 짧게만 한다.
- 수집기는 우리 작업 서버(또는 집 맥)에서 돌린다.

**리스크의 실제 크기**
- 소규모로 제목을 수집하는 수준이라면 최악의 경우 IP 차단이나 계정 제한 정도다.
- 법적 분쟁 사례는 경쟁사 DB를 통째로 복제한 경우들이다 (잡코리아-사람인, 야놀자-여기어때 민사).

**질문을 먼저 잡는 구조**
- 공식 일정이 잡히면 Q&A 글을 미리 만든다. "아이유 콘서트 언제?"가 카페에 올라오기 전에 답이 되는 글이 먼저 있게 된다.

### 5.2 주제 선정 점수
```
점수 = 반응 수 상승도 × 해외 관심(언어별 위키·트렌드·외국인 질문 수) × 카테고리 수익성
       × 에버그린 가중 − 중복 감점        (🔴는 제외)
```

### 5.3 작성 → 검사 → 승인
- **사실 추출**: 누가, 무엇을, 언제, 어디서, 얼마에, 출처 링크
- **작성**
  - 사실 + 포맷 템플릿 + **필진 페르소나**로 쓴다. 동생 말대로 컨셉을 여러 개 둔다. 예: "도쿄 출신 K-pop 덕후 에디터", "타이베이 워홀러 출신 에디터".
  - 'AI 필진'이라고 표시한다.
- **자동 검사**: 숫자와 출처 대조, 🔴 필터, 원문 유사도, 링크가 살아 있는지, FAQ가 있는지
- **승인**
  - 🟢는 바로 발행한다.
  - 🟡는 어드민에서 모바일 1클릭으로 승인한다.
  - 첫 2주는 전량 승인으로 품질을 맞춘다.

### 5.4 이미지 — 이렇게 쓰면 된다
1. **공식 SNS 게시물 임베드**: 소속사·아티스트 공식 IG, X, YouTube. 아이돌 사진 문제를 해결하는 가장 깔끔한 방법이다.
2. **소속사 공식 티저·프로필·앨범 커버 + `Photo: 소속사명` 크레딧**: 홍보용으로 배포한 이미지라 업계 관행이다. 삭제 요청이 오면 즉시 교체한다 (신고 폼).
3. **보도자료 사진**: 인터넷신문으로 등록한 뒤 소속사·홍보사에서 받는다 (11.1).
4. **자동 텍스트카드 썸네일**: 제목 + 배경 + 브랜드. 숏폼 표지로도 쓴다.
5. **AI 일러스트**(음식·풍경, 실존 인물은 쓰지 않는다), Unsplash, 공공누리, 직접 촬영
6. **피할 것**: 사진기자 현장사진(매체 사진)과 홈마 사진. 권리 주장이 확실한 쪽이다.

---

## 6. 웹 기능

### 6.1 공통
- **URL·SEO**
  - `/en`, `/ja`, `/zh-tw`, `/ko` 서브디렉토리
  - hreflang, 언어별 sitemap·RSS, NewsArticle·FAQPage 구조화 데이터
- **페이지**: 홈(오늘의 이슈, 카테고리, 랭킹), 카테고리, 아티스트 태그, 글 상세, 검색
- **글 상세 구성**: 3줄 요약 → 본문 → 외국인이라면 → FAQ → 출처 → 제휴 박스 → 댓글 → 관련 글
- **광고 슬롯**: 본문 중간 1~2개, 하단, 사이드. 처음에는 AdSense, 나중에 헤더비딩으로 교체할 수 있게 슬롯을 컴포넌트로 만든다.
- **제휴 박스**: 카테고리별로 자동으로 붙는다.
  - 여행·콘서트 원정 → Creatrip, Trip.com, Klook, Agoda
  - 워홀 → eSIM, 보험, Wise
  - 한국어 → italki
- **필수 페이지**: About, Contact("광고·제휴·브랜드 문의 환영"), Editorial Policy, Corrections, Privacy, Terms, 제휴 고지 (케이아지트 구성 참고)
- **유럽 방문자**: 구글 인증 CMP를 띄운다. 애드센스의 "개인정보 보호 및 메시지" 기능으로 무료다.

### 6.2 익명 댓글
- **로그인 없음.** 닉네임(선택)과 **비밀번호**를 받고, 수정·삭제는 비밀번호로 한다.
- **닉네임 표시**는 디시 느낌을 그대로 살린다.
  - 예: `ㅇㅇ(7f3a)`, `名無しさん(7f3a)`, `匿名(7f3a)`, `Anon(7f3a)`
  - 괄호 안은 IP 대신 **IP 해시**다. `HMAC(IP, 비밀키 + 글 ID)`의 앞 4자리라서 같은 글 안에서는 같은 사람끼리 구분된다.
  - 보이는 건 디시와 같고 유럽 개인정보 문제도 없다. 디시식 `123.45` 표시로도 바꿀 수 있다.
- **비밀번호**는 Argon2id 해시로 저장한다.
- **스팸 방지**
  - Cloudflare Turnstile(무료)
  - IP 해시별 속도 제한
  - 링크가 들어간 댓글은 보류
  - Haiku로 욕설·스팸을 분류
- **신고**: 누적되면 자동으로 숨기고 운영자에게 알림이 간다.
- **v2**: 댓글 번역 버튼, 댓글 질문을 다음 글 후보로 자동 등록

### 6.3 어드민
- 주제 큐, 🟡 승인(모바일), 발행 일정
- SNS 업로드 큐와 실패 재시도, 샤오홍슈 업로드 팩 다운로드
- 댓글·신고 관리
- 비용 대시보드: 월 상한에 닿으면 자동 정지

---

## 7. 데이터 모델 (초안)

```
Signal       { id, source, title, url, metricsJson, lang, collectedAt }         // 수집 원장 (제목·링크·숫자)
Topic        { id, signalIds[], keyword, score, riskTier(GREEN|YELLOW|RED), status }
Article      { id, topicId, format, category, riskTier, status, factsJson, publishedAt }
Translation  { articleId, locale, slug, title, summary, body, faqJson, seoTitle, seoDesc, indexable }
SourceRef    { articleId, url, publisher, kind(OFFICIAL|NEWS|COMMUNITY) }
Media        { id, articleId, url, kind(EMBED|AGENCY|PRESS|CARD|AI|STOCK|OWN), credit }
Comment      { id, articleId, locale, nickname, idHash, passwordHash, body, status, reportCount, createdAt }
Video        { id, articleId, locale, format, script, ttsUrl, videoUrl, status }
SocialPost   { id, articleId?, videoId?, platform, locale, mode(API|PACK), status, externalId, error, metricsJson }
CostLog      { id, kind(LLM|IMAGE|TTS|API), amountUsd, ref, createdAt }
```

---

## 8. 기술 스택·인프라

### 8.1 이 레포(NeoNews)에서 가져갈 것
- **재사용할 것**
  - 수집기: `playnaver.ts`의 네이버 연예 크롤러, `play1.ts`의 Playwright 골격
  - SEO·sitemap·RSS
  - 애드센스·쿠팡 컴포넌트
- **새로 만들 것**: Next.js 15/16 새 레포(i18n 라우팅), Article과 Translation 분리 스키마

### 8.2 추천 구성

| 영역 | 추천 | 비용 |
|---|---|---|
| 웹 | Vercel Pro (편함) 또는 Cloudflare Workers + OpenNext (저렴함) | $20 / $0~5 |
| DB | Supabase (기존 경험) | $0 → $25 |
| 이미지 저장 | Cloudflare R2 (전송료 0) | 약 $0 |
| 수집기·영상 렌더 | Hetzner VPS 또는 집 맥 | €5~9 / $0 |
| 글 작성 | Claude Sonnet 5.5 | |
| 번역·분류·검사 | Claude Haiku 5.5 | |
| 영상 | Remotion (3인 이하 무료) + FFmpeg + TTS (OpenAI·Google·ElevenLabs) | |
| 헬로톡 수집 | 안드로이드 에뮬레이터 + ADB + Claude 비전 | |
| DNS·캡차·메일 | Cloudflare (DNS, Turnstile, Email Routing) | 무료 |

### 8.3 SNS 배포

| 플랫폼 | 방법 | 메모 | 우선 |
|---|---|---|---|
| YouTube Shorts | 공식 API | 미검증 앱은 비공개로 잠길 수 있다. 감사(2~4주)를 받는 동안에는 Studio에서 예약 업로드를 몰아서 한다 | ★★★ |
| Instagram Reels | 공식 API (Business/Creator 계정) | 24시간에 50~100건 | ★★★ |
| Threads | 공식 API | 24시간에 250건. 대만에서 강하다 | ★★★ |
| X | 공식 API 종량제 | 글 $0.015, 링크가 들어가면 $0.20 → 링크 없이 올리고 프로필에 링크를 둔다. 일본 1순위 | ★★★ |
| Facebook 페이지 | 공식 API | 대만·미국 | ★★ |
| TikTok | **감사를 통과한 업로드 대행 API**(Ayrshare, Upload-Post 등, 가격 미확인) 또는 초안 업로드 후 폰에서 게시만 탭 | 직접 감사를 받기 전까지의 우회로 | ★★ |
| 샤오홍슈 | **업로드 팩**(이미지 9장 + 제목 + 본문 + 태그)을 자동 생성 → 폰으로 하루 5분 | 해외 번호 신규 프로계정은 11월 재개 예정. 그 전에는 개인 계정. 에뮬레이터 자동화는 서브 계정으로 테스트한 뒤 결정 | ★★ |
| Pinterest | 공식 API (승인 후) | 푸드·여행 | ★ |
| 하테나 블로그 | API (AtomPub) | 일본어 요약 + 링크 | ★ |
| Dcard, PTT, Reddit, 知恵袋 | 수동 | 질문 글에 답하면서 링크를 건다 (커뮤니티 규칙에 맞춰) | 가끔 |

- **AI 표시**: TikTok `is_aigc`, 샤오홍슈 AI 체크(중국 규정상 필수), 유튜브는 사실적인 합성일 때만 표시한다. 업로더가 자동으로 붙인다.

---

## 9. 수익

> 매출 예상과 케이아지트 비교는 [`revenue.md`](./revenue.md)에 있다.
> 기본 시나리오 12개월 차 기준 월 매출은 약 700만 원, 웹 PV는 60만이다.

### 9.1 단계별

| 단계 | 수익원 | 메모 |
|---|---|---|
| 오픈 즉시 | **제휴 링크**: Creatrip 8%, Trip.com 최대 7%, Klook, Agoda 4~5%, KKday, Airalo eSIM, SafetyWing, Wise, italki $10~ | 심사가 거의 없다. 가이드형 글과 궁합이 좋다 |
| 오픈 즉시 | 쿠팡 파트너스 | 한국어 페이지와 재한 외국인 글에만 쓴다 (한국 배송) |
| 30편 이후 | **AdSense** | 가이드형 30편으로 승인을 받는다. 유럽용 CMP |
| 대만 트래픽이 생기면 | **adGeek 같은 대만 광고 대행사 (헤더비딩)** | 케이아지트 방식. 여러 광고사가 경쟁해 단가가 오른다 |
| 영어권 트래픽이 생기면 | **Journey by Mediavine** (영어권 세션 월 1,000) → Raptive (월 2.5만 PV) | 애드센스보다 단가가 높다 |
| 채널이 크면 | YouTube 파트너 (구독자 500 / 1,000), TikTok Creator Rewards (팔로워 1만, 1분 이상 영상), 샤오홍슈 蒲公英 | |
| 계속 | **브랜드 협찬·B2B**: 어학원, 워홀 에이전시, 외국인 전문 부동산, 뷰티, 여행사, K-브랜드 해외 홍보 | 케이아지트의 brands@ 창구 방식 |
| 계속 | 디지털 상품: 언어별 "한국 워홀 완벽 가이드", "K-pop 티켓팅 가이드" PDF | 마진이 높다 |

---

## 10. 비용 (월)

| 항목 | 최소 | 권장 |
|---|---|---|
| 웹 호스팅 | $0~5 (Cloudflare) | $20 (Vercel Pro) |
| DB | $0 | $25 |
| 수집·렌더 서버 | $0 (집 맥) | 약 $6~9 |
| LLM (하루 30편 × 6개 언어 기준) | 약 $5~10 | 약 $23~46 |
| 썸네일·TTS | 약 $0~6 | 약 $15~50 |
| X API (링크 없이 하루 10건) | $0 | 약 $5 |
| 도메인 (.com) | 약 $1 | 약 $1 |
| **합계** | **약 $10~30 (1.5만~4만 원)** | **약 $130 (18만 원)** |

- LLM 단가는 1M 토큰당 Haiku 5.5 $0.10/$0.50, Sonnet 5.5 $2/$10이다.
- 초기에는 하루 5~10편이라 실제 비용은 더 적다.

---

## 11. 법·행정 — 이렇게 처리한다

### 11.1 인터넷신문 등록이란?
- **규정**: 신문법은 "매주 새 기사를 올리고 그중 30% 이상을 자체 생산하는 인터넷 매체"에게 **시·도청에 등록**하라고 한다.
- **성격**: 허가나 심사가 아니라 **서류 등록**이다.
- **필요한 것**: 제호(사이트명), 발행인·편집인(둘 다 본인이어도 된다), 주소, 도메인. 2016년 헌재 결정으로 인원 요건이 없어져 **1인 등록이 가능**하다.
- **안 하면**: 과태료(2천만 원 이하) 조항이 있다.
  - 케이아지트도 사이트에 등록번호 표시 없이 운영하고 있다.
  - 오픈을 막는 조건은 아니다.
- **하면 좋은 점**
  - 언론사 자격으로 **소속사·홍보사 보도자료와 공식 사진**을 받을 수 있다. 이미지 문제가 해결된다.
  - 쇼케이스·시사회 취재를 신청할 수 있다.
  - 매체로서 신뢰가 생긴다.
- **결론**: 오픈은 그냥 하고, 트래픽이 붙어 보도자료가 필요해지면 등록한다. 세부 서류와 수수료는 관할 시청에서 확인한다.

### 11.2 나머지 체크
- **사업자등록**: 수익이 계속 생기기 시작하면 홈택스에서 한다. 구글에서 받는 외화 수입은 부가세 영세율이다.
- **필수 페이지**: 개인정보처리방침, 이용약관(신고 시 게시중단 절차), 제휴 고지 문구(쿠팡 파트너스 문구 포함)
- **AI 표시**: 글 하단과 SNS에 자발적으로 표시한다 (AI기본법 대응 겸 신뢰)
- **찌라시 단독 기사를 쓰지 않고**, 기사가 난 것만 "~라는 보도"로 쓴다. 이것만 지켜도 명예훼손 리스크가 크게 준다.

---

## 12. 리스크와 대응

| 리스크 | 대응 |
|---|---|
| 애드센스 거절 | 가이드형 30편으로 재신청. 그동안 제휴 수익으로 버티고, 대만 대행사와 Journey를 대안으로 둔다 |
| 수집처 차단 | 요청 간격과 주기를 조절하고 서브 계정을 쓴다. 소스가 많아서 하나가 막혀도 돌아간다 |
| 아이돌 오보 | 🟡 승인, 숫자는 출처값만 쓴다, 24시간 안에 정정 (Corrections 페이지) |
| 이미지 삭제 요청 | 신고 폼을 두고 즉시 교체한다. 기본 썸네일은 텍스트카드로 |
| 숏폼 수익화 거절 | 유입 통로로 활용, 포맷 다양화, 직접 촬영 소스 |
| 둘 다 본업으로 바쁨 | 🟢 자동 발행, 하루 15분 운영 루틴 (🟡 승인 + 샤오홍슈 팩 업로드) |

---

## 13. 일정

- **Week 0**
  - 도메인과 계정 개설
  - 수집기 3종 먼저 가동 (네이버 연예, 판·더쿠, 공식 일정) → 데이터가 쌓이기 시작한다
- **Week 1~3: MVP 웹**
  - 3개 언어, 3개 카테고리
  - 댓글과 어드민
  - 가이드형 30편 작성 (keywords.md 4장)
- **Week 4~6: 운영 시작**
  - 애드센스 신청과 제휴 가입
  - 이슈형·반응형을 하루 10편으로
  - 숏폼 생성기와 YouTube·IG·Threads·X 업로더
  - **MMA(11/14), MAMA 오사카(11/20), AAA 가오슝(12/5)에 맞춰** 띄운다
- **Month 2~3: 확대**
  - 헬로톡·카페 수집
  - TikTok·샤오홍슈 운영
  - zh-CN·th 추가
  - 하루 20~30편
- **Month 4~6: 수익 확장**
  - 집·부동산 카테고리
  - 대만 대행사와 Journey 신청
  - 인터넷신문 등록
  - 브랜드 B2B와 PDF 판매

---

## 14. 정할 것

| # | 결정 | 추천 |
|---|---|---|
| D1 | 이름·도메인 | **hallyubrief.com** 또는 **seoulissue.com** (연 $11.25, 10/14 기준 등록 가능). `kpop-issue.world`는 첫해 $3.99지만 갱신이 연 $38.10이고, 이름이 K-pop에 묶인다 |
| D2 | 첫 언어 | en · ja · zh-TW |
| D3 | 첫 카테고리 | K-pop·연예 / K-food / 워홀·알바 |
| D4 | 호스팅 | 아끼려면 Cloudflare, 편하려면 Vercel Pro |
| D5 | 레포 | 새 레포 + NeoNews 수집기·컴포넌트 이식 |
| D6 | 역할·비용·수익 배분 | 15장 안 → **둘이 합의** |
| D7 | 계정 | 브랜드용 공용 이메일로 새로 (브리디 계정과 분리) |

**도메인 후보** (10/14 기준 등록 가능): hallyubrief.com, seoulissue.com, hallyuissue.com, kpopissue.com, kissuehub.com, kwavebrief.com, hallyuscoop.com, kdailybrief.com

---

## 15. 역할 (안)

- **성준**: 웹(Next.js), 댓글, SEO, 광고·제휴, 어드민, 계정·행정, 직접 촬영 소스
- **동생**: 수집기(네이버, 카페, 헬로톡 에뮬레이터), 작성 프롬프트와 필진 컨셉, 숏폼 생성, SNS 업로드 자동화
- **같이**: 🟡 승인(하루 10분), 주간 성과 리뷰

---

## 16. 준비물

- [ ] 도메인
- [ ] 브랜드용 구글 계정 → AdSense, Search Console, GA4, YouTube 채널, Google Cloud (YouTube API)
- [ ] Meta: 페이스북 페이지, 인스타 프로페셔널 계정, Threads, 개발자 앱
- [ ] X (+ API 종량제), TikTok (+ 업로드 대행 서비스 검토), 샤오홍슈, Pinterest
- [ ] 서브 네이버 계정 (카페 가입용), 헬로톡 계정, 안드로이드 에뮬레이터 환경
- [ ] Anthropic API 키, TTS 키
- [ ] Cloudflare (DNS, R2, Turnstile, Email Routing), Supabase, (Vercel)
- [ ] 제휴 가입: Creatrip, Trip.com, Klook, Agoda, Airalo, SafetyWing, Wise, italki
- [ ] contact@, brands@ 메일
- [ ] 알림 웹훅 (디스코드 또는 텔레그램)

---

## 부록. 출처 (2026-10-14 조회)

**벤치마크**
- 케이아지트: https://www.kagit.kr/ , https://www.kagit.kr/ads.txt (AdSense + adGeek 관리 섹션)

**구글·플랫폼 정책**
- 스팸 정책: https://developers.google.com/search/docs/essentials/spam-policies
- AI 콘텐츠 가이드: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- 애드센스 자격: https://support.google.com/adsense/answer/9724
- 애드센스 CMP: https://support.google.com/adsense/answer/13554116
- 유튜브 수익화(비진정성 콘텐츠): https://support.google.com/youtube/answer/1311392
- YPP 조건: https://support.google.com/youtube/answer/72851
- 메타 비원본 콘텐츠: https://creators.facebook.com/blog/combating-unoriginal-content

**SNS API**
- YouTube: https://developers.google.com/youtube/v3/docs/videos/insert
- Instagram: https://developers.facebook.com/docs/instagram-platform/content-publishing
- Threads: https://developers.facebook.com/docs/threads/posts
- TikTok: https://developers.tiktok.com/doc/content-sharing-guidelines
- X: https://docs.x.com/x-api/getting-started/pricing
- 샤오홍슈 해외 계정: https://bwb.agency/latest-news/xiaohongshu-new-rules-what-overseas-brands-need-to-know-before-sept-30

**수익**
- Journey: https://www.mediavine.com/blog/introducing-journey-new-ad-management/
- Raptive: https://raptive.com/blog/opening-the-door-to-more-creators-who-meet-raptive-quality-standards/
- Trip.com: https://www.trip.com/partners/index
- Creatrip: https://affiliate.creatrip.com/en/
- italki: https://italki.com/en/affiliates/
- TikTok Creator Rewards: https://support.tiktok.com/en/business-and-creator/creator-rewards-program/creator-rewards-program/

**인프라**
- Vercel fair use: https://vercel.com/docs/limits/fair-use-guidelines
- Cloudflare Workers: https://developers.cloudflare.com/workers/platform/pricing/
- R2: https://developers.cloudflare.com/r2/pricing/
- Supabase: https://supabase.com/pricing
- Claude 가격: https://platform.claude.com/docs/en/about-claude/pricing
- Remotion: https://www.remotion.pro/license

**법**
- 신문법·시행령, 저작권법, 부정경쟁방지법, 정보통신망법: https://www.law.go.kr
- 인터넷신문 인원 요건 삭제 (2016 헌재): https://www.pressian.com/pages/articles/131701
- 국세청 1인 미디어 안내: https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2480&cntntsId=7802

**(미확인)**
- TikTok 업로드 대행 API의 가격과 범위
- adGeek 입점 조건
- 일본 제휴(Amazon.co.jp, A8.net)의 해외 거주자 가입 가능 여부
- 인터넷신문 등록 수수료
