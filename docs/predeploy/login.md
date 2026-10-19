# 로그인(회원)이 필요한가 — 배포 전 검토 (2026-10-19)

- 방법: 코드 읽기(파일:줄), 로컬 운영 빌드 `http://localhost:3400` 응답 확인, 공식 문서(WebKit·LINE·Google·PostHog·Neon·Resend·Upstash). 코드는 고치지 않았다.
- 표시: [확인] = 직접 돌려 봄, [문서] = 공식 문서, [2차] = 업계 글, [추정] = 계산·추론.

## 0. 결론

1. **내일 배포에는 로그인을 넣지 않는다.** 30일 방문자가 51명이라(`BM-VALIDATION.md:8`) 로그인이 벌어 줄 돈이 거의 없다. 게다가 운영 DB가 다음 결제 주기까지 꺼져 있다. 서버에 기대는 신원 기능은 지금 켜도 동작하지 않는다.
2. 진짜 문제는 '로그인이 없다'가 아니다. **아이폰 사파리는 7일 동안 오지 않은 사이트의 localStorage를 지운다.** 그러면 저장함, 내 투표 표시, 피부 타입, 댓글 수정 키가 함께 사라진다.
3. **다음 달:** 서버가 심는 HttpOnly 기기 쿠키로 저장 목록을 서버에 백업한다(가입 없음). 이걸로 7일 삭제를 막고, 투표 신원도 지금보다 정확해진다. 같은 달 **이메일 한 칸**을 붙인다. 매직 링크 하나로 목록 백업, 기기 옮기기, 주간 소식을 함께 해결한다.
4. **나중:** 소셜 로그인은 LINE(ja·zh-TW)만 후보로 둔다. 구글 로그인은 인앱 브라우저에서 막히고, 애플 로그인은 연 $99가 들고, 패스키는 인앱 브라우저에서 안 된다.
5. 배포 전에 문구·판별 4곳만 손보면 된다(§6 '지금', 각 30분 이하).

## 1. 지금 기기에 남기는 값과 사라지는 조건

| 값 | 저장 위치(근거) | 사파리 7일 미방문 | 인앱 브라우저(인스타·스레드·LINE) | 기기를 바꿀 때 |
|---|---|---|---|---|
| 저장함 | `hb:saved` (`apps/web/src/lib/saved.ts:20,111,121`) | **삭제** | 사파리와 따로 저장돼 링크로만 옮길 수 있다 | 없음 |
| 명소 도장 | `hb:visited` (`saved.ts:25`) | 삭제 | 따로 | 없음 |
| 내 평가 표시 | `hb:vote:{kind}:{id}` (`components/ItemVote.tsx:103`) | 화면 표시만 삭제, 서버 표는 남음 | 따로 | 없음 |
| 피부 타입 | `hb:skin-type` (`components/beauty/useSkinType.ts:19,29`) | 삭제 → 다음 투표에 피부 타입이 빠짐 | 따로 | 없음 |
| 댓글 수정·삭제 키 | `hb:comment-key` (`components/Comments.tsx:44-52`) | 삭제 → **내 댓글을 지울 수 없음** | 따로 | 없음 |
| 중복 투표 막기 | 서버 `voterHash = HMAC(scope, IP, UA)` (`lib/voter.ts:11-13`) | 영향 없음 | 영향 없음 | 영향 없음 |
| 서버 쿠키 | `NEXT_LOCALE` 세션 쿠키 하나뿐 [확인] | — | — | — |

## 2. 공식 근거

| 사실 | 출처 |
|---|---|
| 스크립트로 쓴 저장소(LocalStorage·IndexedDB·SessionStorage·서비스워커 캐시)는 "사파리를 쓴 날로 7일 동안 그 사이트와 상호작용이 없으면" 지운다 | [문서] WebKit Tracking Prevention '7-Day Cap on All Script-Writeable Storage', WebKit 블로그 10218 |
| 홈 화면 웹앱은 이 삭제에서 빠진다. 다만 데이터는 "kept isolated from Safari", 즉 사파리와 분리된다 | [문서] 같은 문서 'Home Screen Web Application Domain Exempt From ITP' |
| 서버 응답(Set-Cookie)으로 심은 쿠키는 CNAME 위장이나 제3자 IP 위장일 때만 7일로 줄인다 | [문서] 같은 문서 'CNAME and Third-Party IP Address Cloaking Defense'. 우리 쿠키는 같은 호스트(unnienote.app)가 심으므로 해당하지 않는다 [추정] |
| 스크립트로 만든 쿠키는 7일, 링크 장식으로 들어온 경우는 24시간이 상한이다. GA4 `_ga`도 여기에 걸린다 | [문서] 같은 문서 |
| iOS 14부터 모든 WKWebView에 ITP가 기본으로 켜져 있고, 인앱 브라우저는 앱마다 저장소가 따로다 | [2차] WWDC20 노트, Simo Ahava |
| 사파리 26은 UA의 OS 버전을 18.6/18.7로 고정한다. 그래서 아이폰 사파리 UA는 사람마다 거의 같다 | [문서] WebKit 버그 298260 |
| 구글 OAuth는 임베디드 웹뷰를 막는다(`disallowed_useragent`) | [문서] Google Developers Blog 2021-06 |
| 패스키는 연관 도메인이 없는 다른 앱의 WKWebView에서 안 된다 | [문서] WebKit 버그 220559, Yubico FAQ |
| 링크에 `?openExternalBrowser=1`을 붙이면 LINE이 외부 브라우저로 연다 | [문서] LINE Developers 'Using LINE URL scheme' |
| PostHog 쿠키 없는 모드는 솔트가 날마다 바뀌어 "different people each day"가 된다 | [문서] PostHog cookieless-tracking 'Limitations' |
| Neon 무료 플랜은 100 CU-시간이고, 다 쓰면 "다음 결제 주기까지" 컴퓨트가 멈춘다. 저장 공간은 1GB | [문서] neon.com/pricing |

## 3. 우리 기능에 주는 영향

| 영향 | 근거 | 심각도 |
|---|---|---|
| 여행 준비(출국 몇 주 전 저장)와 정면으로 어긋난다. 7일 넘게 안 오면 저장함이 비어 있다. 독자 4/6이 이미 지적했다 | `BM-VALIDATION.md:34` | 높음 |
| "홈 화면에 추가하면 저장한 게 그대로 유지돼요"는 사실과 다르다. 설치해도 사파리 목록은 넘어가지 않는다. 홈 화면 앱에는 주소창도 붙여넣기 칸도 없어 `?i=` 링크로 옮길 길이 없다 | `messages/ns/Engage/ko.json:64`(9개 언어 같음), `components/saved/SavedView.tsx:165-168` | 중간 |
| 인앱 경고가 스레드·틱톡·카카오·X에서는 뜨지 않는다. 다음 주 1순위 채널이 스레드다 | `components/saved/sendList.ts:13` `/Instagram\|FBAN\|FBAV\|\bLine\//`. 대표 UA 6개로 시험한 결과 인스타·LINE만 true [확인] | 중간 |
| LINE '나에게 보내기'로 받은 링크를 LINE에서 누르면 다시 LINE 인앱 브라우저로 열려 목록이 또 갇힌다 | `sendList.ts:25,42` (외부 브라우저 파라미터 없음) | 중간 |
| 투표 신원이 IP와 UA에 묶여 있다. 같은 와이파이나 통신사 NAT를 쓰는 아이폰 둘은 해시가 같아서 뒤 사람의 답이 앞 사람의 표를 덮는다. 반대로 IP가 바뀌면 같은 사람이 새 표를 낸다 | `lib/voter.ts:11-13`, `lib/item-votes.ts:149,157` (upsert) | 중간 |
| 처리방침은 "같은 기기에서 내 댓글을 언제든 지울 수 있어요"라고 하지만, 사파리에서는 7일 뒤 키가 지워져 이 말이 틀리게 된다 | `messages/ns/Trust/pages/ko.json:155` | 낮음~중간 |
| 'saved_view 7일 재방문 ≥25%' 지표를 잴 수 없다. PostHog는 쿠키 없는 모드라 날마다 새 사람이 되고, `_ga`도 사파리에서 7일이 상한이다 | `docs/monetize/PLAN.md:353`, `apps/web/src/instrumentation-client.ts:13` | 중간 |

## 4. 돈: 로그인이 주는 것과 잃는 것

| 항목 | 로그인·이메일이 주는 것 | 지금 규모에서 | 판단 |
|---|---|---|---|
| 재방문 | 이메일은 유일하게 우리가 소유하는 채널이다(`BM-VALIDATION.md:188`). 다만 뉴스레터 구독자 중 대부분을 읽는 사람은 38%다 [2차, Pew 2025] | 가입률 1~3%로 잡으면 월 0.5~1.5명 [추정] | 이메일 칸은 싸게 붙인다. 회원제는 이르다 |
| 협찬 영업(독자 수) | 확인된 구독자 수와 오픈율이 숫자로 남는다. 지금 PostHog 순방문자는 하루 단위로만 정확하고 월 단위로는 부풀려진다 [문서] | 협찬 영업 기준은 월 5만 PV 또는 팔로워 1만(`BM-VALIDATION.md:51`) | 구독자 수는 1,000명을 넘어야 영업 자료가 된다 [추정] |
| 광고 단가 | 로그인 ID로 단가를 올리려면 UID2 같은 프로그래매틱 체계와 규모가 필요하다. 애드센스는 아직 승인 전이다 | 0 | 효과 없음 |
| 제휴 | 저장 목록을 메일로 다시 알리면(예: 여행 D-7) 클릭할 기회가 생긴다 | 0에 가깝다 | 이메일과 묶는다 |
| **잃는 것** | 가입을 강요하면 이탈한다. 결제 단계에서 '계정 만들기 싫어서' 떠나는 비율이 19%다 [2차, Baymard]. 가입 없이 저장되는 점은 독자 평가에서 강점으로 꼽혔다(`BM-VALIDATION.md:22`). 구글 로그인은 인스타·스레드 인앱에서 실패 화면이 뜬다 | — | 로그인을 저장의 조건으로 걸지 않는다 |

## 5. 대안 비교

| 안 | 해결하는 것 | 공수(이 코드 기준) | 운영비 | 개인정보 의무 | 보안 위험 | DB가 꺼지면 |
|---|---|---|---|---|---|---|
| **A. 로그인 없이 유지 + 손질** | 인앱 안내만 나아진다. 7일 삭제와 기기 바꿈은 못 푼다 | S: Engage 9개 언어 문구, `sendList.ts` 정규식·LINE 파라미터 | 0원 | 지금 그대로 | 없음 | 영향 없음 |
| **B. HttpOnly 기기 쿠키 + 서버 백업** | 사파리 7일 ○, 투표 신원 ○. 인앱·기기 바꿈 × | M~L: `app/api/saved/sync/route.ts`(POST 저장·GET 복원, 첫 저장 때 `hb_did` HttpOnly·Secure·SameSite=Lax·Max-Age 400일). `lib/saved.ts`는 로컬을 먼저 쓰고 서버에 동기화한다. 테이블은 `SavedBackup(deviceHash PK, items JSON, updatedAt)` 하나. `voter.ts`는 쿠키가 있으면 기기 ID로 해시한다 | 0원: 행이 1KB 미만이라 1만 기기면 약 10MB. 한 번 깨우면 0.25CU×5분≈0.02 CU-시간이므로, 월 1,500번이 모두 따로 깨워도 31 CU-시간(무료의 31%) [추정]. 백업만 Upstash 무료(250MB·월 50만 명령)로 옮기면 Neon과 떨어진다 | 처리방침에 기기 ID·보관 기간(마지막 사용 후 13개월)·'서버에서 지우기' 버튼을 적는다. **저장을 누를 때만** 심으면 CNIL의 '사용자가 요청한 기능' 면제를 받아 동의 배너가 필요 없다. 분석·광고에 다시 쓰면 면제가 깨진다 | 쿠키를 탈취당하면 목록이 보인다(민감도 낮음). 시술 저장은 건강과 관련된 관심이라 백업에서 빼거나 따로 고지한다 | 백업만 실패하고 로컬 목록은 그대로다 |
| **C. 이메일 매직 링크** | 기기 바꿈 ○, 7일 ○. 메일 앱에서 링크를 열면 사파리로 열려 인앱에서 빠져나오는 다리가 된다. 주간 소식 | M~L: `Subscriber(email, locale, source, consentNews, consentAt, ageOk, verifiedAt, unsubAt)`, `MagicToken(hash, expiresAt, usedAt)`, `api/mail/request`, `/[locale]/saved/restore`(GET은 확인 버튼만, POST로 토큰을 쓴다. 메일 보안 스캐너가 링크를 미리 열어 토큰을 써 버리는 것을 막는다), `api/unsubscribe`, `lib/mail.ts`, 9개 언어 메일 | Resend 무료: 거래 메일 월 3,000·하루 100통, 마케팅 연락처 1,000명. 도메인 SPF·DKIM·DMARC 설정 | 동의 받기(목적·항목·보관·거부권). 만 14세 미만 금지(개인정보보호법 22조의2). fr은 15세라 '만 15세 이상'으로 통일한다. 제휴 링크가 있는 소식이면 정보통신망법 50조에 따라 별도 수신 동의, 제목에 '(광고)', 수신거부, 2년마다 동의 확인 [2차]. GDPR은 동의 기록, 이중 확인 권장, 미국 발송사로의 이전 고지 | 토큰 유출·재사용(15분·1회·해시만 저장으로 막는다). 발송 남용으로 하루 100통이 바닥날 수 있다(IP·주소별 제한). 가입 여부를 노출하지 않는다 | 링크를 확인할 수 없어 복원과 가입이 멈춘다 |
| **D. 소셜 로그인(구글·애플·LINE)** | 기기 바꿈 ○, 7일 ○ | L: Auth.js + Prisma 어댑터(User·Account·Session·VerificationToken), 요청마다 DB를 깨우지 않도록 JWT 세션, 제공자별 콘솔 | 구글·LINE 0원, 애플 연 $99와 비공개 릴레이 메일 등록 | 받는 항목을 `openid` 하나로 줄인다. 탈퇴·파기 절차 | OAuth state·PKCE, 계정 연결 오류 | 로그인 불가 |
| ↳ 인앱 | 구글은 인스타·스레드·틱톡에서 차단된다. LINE은 LINE 인앱 안에서 바로 된다(ja·zh-TW 주력) | | | | | |
| **E. 패스키** | 애플 기기끼리 iCloud 키체인으로 동기화된다 | L+: SimpleWebAuthn, User·Authenticator 테이블, 복구용 이메일이 따로 필요 | 0원 | 계정 데이터 | 복구 흐름이 약하다 | 로그인 불가. 인앱 WKWebView에서는 아예 안 된다 |

**시술(clinic) 원칙:** 시술 평가나 저장을 이메일·계정과 묶는 순간 건강 관련 민감정보가 된다(개인정보보호법 23조, GDPR 9조). 지금 처리방침은 "누가 답했는지 우리도 알 수 없어요"라고 약속한다(`messages/ns/Trust/pages/ko.json:106`). B·C·D 모두 시술 항목은 익명으로 남긴다.

## 6. 단계별 권고

| 시기 | 할 일 | 이유와 조건 |
|---|---|---|
| **지금**(내일 배포, 수정은 별도 작업) | ① `savedInstall` 9개 언어를 "홈 화면 앱에서 저장한 건 오래 남아요"로 바꾼다 | 지금 문구는 사실과 다른 약속이다 |
| | ② `IN_APP` 정규식에 `Barcelona`(스레드), `BytedanceWebview\|musical_ly`(틱톡), `KAKAOTALK`, `Twitter`를 더한다. `InstallPrompt.tsx:47` 목록과 합친다 | 1순위 채널인 스레드에서 경고가 뜨지 않는다 |
| | ③ LINE으로 보내는 링크에 `openExternalBrowser=1`을 붙인다 | 목록이 다시 LINE 인앱에 갇히는 것을 막는다 |
| | ④ `saved_view`에 `oldestDays`(가장 오래된 저장이 며칠 지났는지) 속성을 넣는다 | 신원 없이도 '7일이 넘은 목록으로 돌아온 비율'을 잴 수 있다. 지금 지표는 잴 수 없다 |
| | (선택) 처리방침 `rights`에 "사파리는 7일 넘게 안 오면 지울 수 없을 수 있어요, 문의해 주세요"를 더한다 | 권리 안내를 정확하게 |
| **다음 달**(DB 정리 뒤) | ⑤ Neon 요금제를 정하거나 백업을 Upstash 무료로 뗀다. Launch 종량제는 $0.106/CU-시간 | 컴퓨트가 꺼진 동안 서버 신원 기능은 전부 멈춘다 |
| | ⑥ B안: 기기 쿠키 + 백업. 쿠키는 ISR 페이지(`Cache-Control: s-maxage=31536000`)가 아니라 API 응답에서 심는다 | 아이폰의 7일 삭제를 푼다. 가입 마찰이 없다 |
| | ⑦ C안: `/saved`와 피부 타입 결과에 이메일 한 칸을 둔다. `BM-VALIDATION.md:115`의 `Subscriber`와 합친다 | 기기 바꿈과 인앱 탈출, 소유 채널을 함께 얻는다 |
| **나중**(월 방문 1만 이상이고 구독자 500명 이상, 또는 '여러 기기' 요청이 실제로 올 때) | ⑧ LINE 로그인(ja·zh-TW)을 검토한다. 구글·애플·패스키는 보류 | 인앱 비중이 높아 LINE만 마찰이 낮다 |
| | ⑨ PRD §12 '로그인·회원 안 함'(`PRD.md:309`)을 '비밀번호 회원가입 안 함. 기기 쿠키·이메일 백업은 함'으로 고쳐 기록한다 | 결정을 문서에 남긴다 |

## 7. 측정 명령

| 명령 | 결과 |
|---|---|
| `curl -s -o /dev/null -D - http://localhost:3400/ja/saved` | `set-cookie: NEXT_LOCALE=ja; Path=/; SameSite=lax`, `Cache-Control: s-maxage=31536000`. 기기 쿠키는 없다 |
| `curl "http://localhost:3400/api/saved?locale=ja&items=place:hongdae-street,beauty:xx"` | 200, 0.04초, 없는 항목은 빠진다. 카탈로그 항목은 DB를 쓰지 않고, 글 항목만 DB를 쓴다(`data/catalog.ts:131-139`) |
| 대표 UA 6개를 `/Instagram\|FBAN\|FBAV\|\bLine\//`에 넣어 봄(node) | 인스타·LINE만 경고. 스레드·틱톡·카카오·X는 경고 없음. UA는 공개 형식을 본뜬 것이고 실기기에서 다시 확인해야 한다 |
| `grep -rn '"hb:' apps/web/src` | 기기 키 13개와 세션 키 3개(`app/[locale]/privacy/page.tsx:24-44`) |

## 출처

- WebKit Tracking Prevention: https://webkit.org/tracking-prevention/
- WebKit 블로그 'Full Third-Party Cookie Blocking and More': https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- WebKit 'Updates to Storage Policy'(persist는 홈 화면 앱 위주로 허용): https://webkit.org/blog/14403/updates-to-storage-policy/
- 사파리 26 UA 고정: https://bugs.webkit.org/show_bug.cgi?id=298260
- 구글 임베디드 웹뷰 차단: https://developers.googleblog.com/2021/06/upcoming-security-changes-to-googles-oauth-2.0-authorization-endpoint.html
- 패스키와 WKWebView: https://bugs.webkit.org/show_bug.cgi?id=220559 , https://developers.yubico.com/WebAuthn/Supporting_FIDO2_Security_Keys_on_iOS_or_iPadOS/FAQ.html
- WKWebView ITP 기본 적용: https://www.simoahava.com/privacy/intelligent-tracking-prevention-ios-14-ipados-14-safari-14/
- LINE URL scheme: https://developers.line.biz/en/docs/messaging-api/using-line-url-scheme/
- PostHog 쿠키 없는 추적: https://posthog.com/docs/data/cookieless-tracking
- Neon 요금: https://neon.com/pricing · Resend 요금: https://resend.com/pricing · Upstash 요금: https://upstash.com/pricing/redis
- Baymard 결제 UX: https://baymard.com/blog/current-state-of-checkout-ux · Pew 뉴스레터: https://www.pewresearch.org/chart/many-email-newsletter-subscribers-dont-read-most-of-the-newsletters-they-get/
- CNIL 쿠키 면제(요약): https://iapp.org/news/a/cnil-releases-cookie-guidance/
