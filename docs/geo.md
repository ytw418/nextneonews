# SEO · AEO · GEO 운영

> 2026-10-15 · 공식 문서 확인 결과 기준. 출처는 맨 아래에 있다.

| 구분 | 무엇인가 | 볼 지표 | 어디서 보나 |
|---|---|---|---|
| SEO | 검색 결과에서 페이지를 발견하고 방문 | 노출, 클릭, 클릭률, 순위, 유입 후 행동 | Search Console 실적, GA4 |
| AEO | 질문의 답이 검색 기능(답변 영역)에 표시 | 답변 노출, 연결 URL, 클릭 | Search Console **생성형 AI 실적 보고서**(2026-08 출시, 노출 중심) |
| GEO | AI 답변(ChatGPT·Perplexity·Gemini·Copilot·Claude)에 브랜드나 콘텐츠가 인용 | 브랜드 언급, 출처 링크, 확인 가능한 유입 | **Bing Webmaster Tools AI 실적**(Copilot 인용 수·인용 페이지), `utm_source=chatgpt.com` 유입, `npm run worker -- geo-check` |

---

## 1. 이미 구현한 것

**AI 크롤러 허용** (`apps/web/src/app/robots.ts`)
- AI 검색·답변용: Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Agent, meta-webindexer, Applebot
- 학습용도 허용: GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, Meta-ExternalAgent

**구조화 데이터 (JSON-LD)**
- 전체 페이지: Organization, WebSite
- 기사 페이지: NewsArticle, BreadcrumbList, FAQPage
  - NewsArticle에는 게시일·수정일, 출처 URL(`isBasedOn`), 등장 인물·작품(`about`)을 넣는다. `about`에는 한국어 표기와 별칭이 들어간다.
  - Google은 2026-05부터 FAQ 리치 결과를 표시하지 않는다. FAQ는 화면에 보이는 본문으로 남겨 두고 다른 AI용으로만 둔다.

**AI가 인용하기 좋은 글 구조** (`apps/worker/src/ai/prompts.ts`)
- 첫 문단에서 누가·무엇을·언제를 40~60단어로 바로 답한다.
- 소제목은 독자가 검색할 질문 형태로 쓴다.
- 핵심 요약 3줄은 한 문장만 떼어도 뜻이 통하게 쓴다.
- 일정·순위는 표로 정리한다.
- 문장 안에 출처를 밝힌다.
- FAQ 3개를 둔다.

**그 밖에 구현한 것**
- 게시일·수정일 표시, 언어별 대체 링크(hreflang), sitemap
- `/llms.txt`: Google은 쓰지 않는다고 밝혔고 효과는 미지수다. 비용이 0이라 그냥 둔다.
- **IndexNow**: 글을 발행하면 Bing·Naver·Yandex 등에 새 URL을 바로 알린다. 운영 도메인과 `INDEXNOW_KEY`가 있어야 동작한다.

## 2. 오픈할 때 꼭 할 것

1. **Cloudflare를 쓰면 AI 봇 정책부터 확인한다.**
   - 2026-09-15부터 광고가 있는 신규 도메인은 학습·에이전트 봇이 기본 차단된다.
   - 학습 차단은 Googlebot·Bingbot 같은 겸용 크롤러까지 막을 수 있다.
   - 경로: Security Settings → Configure AI bot policies
   - "Managed robots.txt"는 끈다.
2. **Search Console**
   - 사이트를 등록하고 sitemap을 제출한다.
   - 설정 → Search generative AI에서 AI 기능 **포함**을 확인한다.
3. **Bing Webmaster Tools**: 등록하고 AI Performance 보고서를 켠다. Copilot 인용을 여기서 본다.
4. `.env`에 `INDEXNOW_KEY`(8~128자 영숫자)와 실제 `SITE_URL`을 넣는다.

## 3. GEO 측정: `geo-check`

```bash
npm run worker -- geo-check 8   # 목표 질문 8개 → 답변이 인용한 도메인 기록 (GeoCheck 테이블)
```

- Claude 웹 검색 답변을 다른 AI 검색엔진의 **대리 지표**로 쓴다. ChatGPT·Perplexity 결과와 같지는 않다.
- 비용은 질문 1개에 약 100원이다. **월 1회**만 돌린다.
- 목표 질문은 `apps/worker/src/geo/questions.ts`에 있다. 문구를 바꾸지 않아야 변화를 비교할 수 있다.

### 기준선 (2026-10-15, 사이트 비공개 상태)

| 질문 | 인용된 출처 |
|---|---|
| ja 외국인 콘서트 티켓 구매 (NOL World) | world.nol.com, creatrip.com, blstweb.jp (개인 블로그) |
| ja MAMA 2026 오사카 일정·티켓 | mnetjp.com |
| ja 메리 베리 러브 어디서 보나 | disneyplus.com |
| zh-TW AAA 2026 가오슝 일정·예매 | (인용 없음) |
| zh-TW 대만인 한국 워홀 조건·마감 | mofa.go.kr (대사관) |
| en 한국 번호 없이 K-pop 티켓 사기 | blog.namanecard.com |
| en 한국 편의점 2026 추천 | rusticpathways.com |
| en 메리 베리 러브 디즈니+ 순위 | mydramalist.com |

**시사점**
- 공식 사이트 다음으로 **개인 블로그와 틈새 가이드**가 인용된다. 예: blstweb.jp, namanecard 블로그.
- 큰 매체가 독점하지 않아서 **질문형 가이드를 꾸준히 쓰면 들어갈 자리가 있다.**
- 대만 번체 AAA 질문은 인용된 출처가 없었다. **번체 일정·예매 가이드는 비어 있는 자리**다.

## 출처
- 크롤러 토큰
  - OpenAI: https://developers.openai.com/api/docs/bots
  - Anthropic: https://support.claude.com/en/articles/8896518
  - Perplexity: https://docs.perplexity.ai/guides/bots
  - Google: https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
- Google AI 기능 안내: https://developers.google.com/search/docs/appearance/ai-features
- Google 검색 업데이트(FAQ 리치 결과 종료, llms.txt 미사용): https://developers.google.com/search/updates
- Search Console 생성형 AI 실적 보고서: https://support.google.com/webmasters/answer/16984139
- Search Console AI 노출 설정: https://support.google.com/webmasters/answer/16908024
- Bing AI Performance 보고서: https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview
- Cloudflare AI 봇 차단: https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/
- IndexNow 참여 검색엔진: https://www.indexnow.org/searchengines.json
