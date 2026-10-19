# 검증: 아이폰 사파리에서 여는 괄호가 줄 끝에 남는다는 보고

검증일 2026-10-20 · 대상 http://localhost:3400 (dev 최신 빌드) · 코드는 고치지 않았다(점검만).

## 결론

| 항목 | 판정 |
|---|---|
| 재현 | **iOS 27(Safari 27)에서만 재현된다.** iOS 18.6·26.3.1 Safari 실기 시뮬레이터에서는 같은 페이지·같은 HTML 모두 0건이다 |
| 원인 | 사이트 코드 결함이 아니라 **WebKit 의 변경**이다. WebKit 311090@main(2026-04-13, Safari 27 포함)이 `word-break: keep-all` 에서 "모든 구두점 뒤"에 줄바꿈 기회를 열었는데, 여는 괄호(유니코드 Ps)도 포함됐다 |
| 진짜 문제인가 | 예. iOS 27 은 2026-09 출시돼 쓰이고 있고, 우리 `keep-all` 이 그 경로를 탄다. 설계 문서(`docs/monetize/DESIGN.md:198` "제목은 Phrase + 전역 line-break: strict")의 의도와도 어긋난다 |
| 심각도 | **낮음** — 글은 다 읽히고 동작 문제는 없는 조판 흠이다. 운영에도 이미 있다(`Phrase.tsx` 는 main 에 같은 코드). 배포를 막을 일은 아니다 |
| QA 보고에서 바로잡을 점 | "아이폰 사파리" 전체가 아니라 **iOS 27 이상**이다. QA 가 쓴 Playwright WebKit 은 `27.2` 빌드라 iOS 27 동작을 보인 것이다 |

## 1. 같은 HTML, 같은 글꼴로 엔진별 비교

시험 HTML: 폭 9.5em, 20px, 웹폰트(Arial Unicode)로 고정. 결과는 글자 위치로 줄을 나눈 것이다(` / ` = 줄바꿈).

| 경우 | Playwright WebKit 27.2 | iOS 26.3.1 Safari | iOS 18.6 Safari | Chromium |
|---|---|---|---|---|
| A 현재 코드(keep-all + `<wbr>` + anywhere) | `ボトックス（ / ボツリヌストキシン / ）` **결함** | `ボトックス / （ボツリヌストキシ / ン）` | 왼쪽과 같음 | 왼쪽과 같음 |
| C keep-all, `<wbr>` 없음 | `ボトックス（ / ボツリヌストキシン）` **결함** | 한 줄로 넘침(공백에서만 끊음) | 같음 | `ボトックス / （ボツリヌストキシン）` |
| F 제안 ②: `（ボ` 를 nowrap 묶음 | `ボトックス / （ボツリヌストキシ / ン）` 정상 | 정상 | 정상 | 정상 |
| G ru keep-all | `Коррекция птоза ( / операция …` **결함** | `… птоза / (операция …` | 같음 | 같음 |
| H ru 기본(keep-all 없음) | 정상 | 정상 | 정상 | 정상 |

- 캡처: `docs/predeploy/shots/kinsoku-pw-webkit27.png`(결함), `docs/predeploy/shots/kinsoku-ios18.6-26.3-safari.png`(정상, 18.6·26.3.1 캡처가 픽셀까지 같아 하나로 둠)
- iOS 는 Xcode 26.3 시뮬레이터 Safari + `safaridriver`(포트 4448)로 직접 띄워 쟀다. iOS 27 런타임은 이 Mac 에 없어 실기 확인은 못 했다.

## 2. 실제 페이지 비교(폭 402px 로 맞춤)

명령: `/tmp/kinsoku-verify/pages.mjs`(여는 괄호 `（ ( 「 『 【 〔 ［` 다음 글자가 아랫줄로 가면 1건). iOS 에서 검출 스크립트가 잡는지 양성 대조(`ボトックス（<wbr>ボツ…`)로 먼저 확인했다(1건 검출).

| 주소 | PW WebKit 27.2 | iOS 18.6 Safari | Chromium |
|---|---|---|---|
| /ja/clinic | 4 | 0 | 0 |
| /ja/clinic/botox | 4 (제목 포함) | 0 | 0 |
| /ja/clinic/rejuran | 4 | 0 | 0 |
| /ja | 1 (`「新天地…`) | 0 | 0 |
| /zh-TW | 3 (`「臉變好，` 등) | 0 | 0 |
| /zh-TW/drama | 1 (`淨膚雷射（Laser toning`) | 0 | 0 |
| /ru/clinic · /ru/clinic/ptosis-correction | 2 · 1 | 0 · 0 | 0 · 0 |
| /ja/guide, /zh-TW/clinic, /zh-TW/guide, /zh-CN/clinic, /ko/clinic, /ko/clinic/botox, /en/clinic, /vi/clinic | 0 | 0 | 0 |
| 합계(17쪽) | **20** | **0** | **0** |

QA 의 전수 숫자(830쪽 중 197쪽 289곳)는 다시 세지 않았다. 표본 경향(ja·zh·ru 에서만, Chromium 0)은 QA 와 같다. QA 가 말한 `kinsoku.mjs`·`shots/zh-tw-crossrail.png` 등은 저장소에서 찾지 못했다.

## 3. 원인 근거

| 근거 | 내용 |
|---|---|
| WebKit 버그 [312099](https://bugs.webkit.org/show_bug.cgi?id=312099) | "word-break: keep-all incorrectly suppresses break opportunities at CJK punctuation", 2026-04-13 해결 |
| 커밋 [311090@main e9f4202ae07b](https://commits.webkit.org/311090@main) | `BreakablePositions.h` 에 `PunctuationBreaks` 추가. 16비트 문자열(U+00FF 넘는 글자가 하나라도 있는 글)에서 `U_GC_PS_MASK | U_GC_PE_MASK | U_GC_PI_MASK | U_GC_PF_MASK | U_GC_PO_MASK` 뒤를 끊을 수 있게 함 — **PS(여는 괄호)가 들어 있다** |
| [pretext PLATFORM_BUGS.md](https://github.com/chenglou/pretext/blob/main/PLATFORM_BUGS.md) "Safari: keep-all and punctuation" | "Safari 26 은 keep-all 을 공백에서만 끊고, Safari 27 은 마지막 글자를 뺀 모든 구두점 뒤에서 끊는다, `(` 포함, U+00FF 넘는 글자가 있을 때만". iOS 27 측정일 2026-09-24. 상위 보고 WebKit [298022](https://bugs.webkit.org/show_bug.cgi?id=298022) 는 아직 NEW |
| 우리 코드 | `apps/web/src/components/Phrase.tsx:21`, `apps/web/src/components/guide/Words.tsx:7` 가 `[word-break:keep-all]` 를 건다. Words 는 Phrase 가 손대지 않는 언어(ru·vi·en 등)에도 keep-all 을 건다 |
| BudouX 는 무관 | `ボトックス（ボツリヌストキシン）` → `["ボトックス","（ボツリヌストキシン）"]` 로 괄호를 뒤 구에 붙인다. 문제는 그 뒤 엔진이 `（` 다음을 또 끊는 것 |

영어·베트남어처럼 Latin-1 범위 글만 있는 문구는 이 경로를 타지 않아 0건이다. ru 는 키릴 문자(U+0400대)라 걸린다.

## 4. QA 수정안 평가

| 수정안 | 판단 |
|---|---|
| ① Words 에서 ko·ja·zh 외 언어는 keep-all 을 뺀다 | 맞다. 표 1의 H(ru 기본)는 모든 엔진에서 정상. 비용 작고 부작용 없음 |
| ② ja·zh 는 Phrase 에서 여는 괄호와 다음 글자를 `whitespace-nowrap` 로 묶는다 | 표 1의 F 로 Playwright WebKit 27.2 에서 효과 확인, iOS 18.6·26.3·Chromium 에서 부작용 없음 |
| 빠진 곳 | **ko** 도 keep-all 을 쓰므로 같은 결함이 날 수 있다(pretext 기록: "Korean … after `(`"). 표본 ko 페이지에선 괄호가 줄 끝에 걸린 곳이 없었을 뿐이다. ②를 Words(ko 포함)에서 하면 같이 막힌다 |
| U+2060 무효 | 맞다. 커밋 코드가 구두점 바로 뒤 위치를 그대로 끊는 자리로 돌려주므로 WJ 가 소용없다 |

## 5. 권장

- 내일 배포는 그대로 해도 된다(운영에 이미 있는 결함, 동작 문제 아님).
- 다음 정리 때 ①+②(ko 포함)로 고친다. 확인은 Playwright WebKit(27.2)로 하면 된다 — iOS 27 동작과 같은 코드다.
- 실기 확인: iOS 27 아이폰에서 `/ja/clinic/botox`(작은 폭 기기면 제목), `/ja/clinic` 목록, `/ru/clinic` 을 한 번 본다.

## 재현 명령(임시 폴더, 저장소 밖)

```bash
node /tmp/kinsoku-verify/pw-mini.mjs http://127.0.0.1:3499/t2.html   # 시험 HTML(파이썬 http.server 3499 로 띄워야 함)
S=<safaridriver 세션> node /tmp/kinsoku-verify/pages.mjs              # 실제 페이지 3엔진 비교, 주소는 urls.txt
```

정리: 직접 켠 시뮬레이터 2대(iPhone 17 iOS 26.3.1, iPhone 16 Pro iOS 18.6)와 safaridriver·임시 서버는 껐다. 원래 켜져 있던 iPhone 16(iOS 18.6)은 건드리지 않았다.
