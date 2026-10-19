# 검증 — 일본어 좁은 화면 단어 중간 줄바꿈 (qa-flows.md #7)

- 대상: `qa-flows.md:67` #7 "ja 좁은 화면에서 단어 중간 줄바꿈 'リップスリーピン/グマスク', '（韓/国の定価）'"
- 환경: `http://localhost:3400` (dev 최신 빌드 `1bb6006`), Playwright 1.64.1 WebKit(2370), 기기 설정 `devices[...]`, `locale: ja-JP`. 코드는 고치지 않았다(측정 때 브라우저 안 DOM·CSS만 바꿈).
- 판정: **실제 있음, 심각도 낮음.** 다만 QA가 쓴 위치·고침안은 일부 틀렸다(아래 3·4절).

## 1. 재현 결과 (WebKit, 줄 = ` / `)

| 기기(폭) | 화면 | 가격 범례 `priceLegend` | 제품명 |
|---|---|---|---|
| iPhone SE 1세대(320) | `/ja/beauty` | `…3万ウォ / ン以上（韓国の定価）` | `リップスリーピ / ングマスク`, `マスクフィット / レッドクッショ / ン` |
| **iPhone SE 3세대(375)** | `/ja/beauty` 첫 화면 | **`…以上（韓 / 国の定価）`** (QA와 같음) | `リップスリーピング / マスク` (자연스러움, 첫 화면 밖) |
| iPhone SE 3세대(375) | `/ja/beauty/awards/lip` 1위 카드 | 같음 | **`リップスリーピン / グマスク`** (QA와 같음) |
| iPhone 13(390) | `/ja/beauty` | `…（韓国 / の定価）` (자연스러움) | `リップスリーピングマ / スク`, **`ドクダミポアコントロ / ールクレンジング…`** |
| iPhone 15(393) | `/ja/beauty` | `…（韓国 / の定価）` | `リップスリーピングマ / スク` |
| iPhone 15 Pro Max(430) | `/ja/beauty` | 한 줄 | `リップスリーピングマス / ク`, `マスクフィットレッドクッ / ション` |
| Chromium SE 3세대(375) | `/ja/beauty` | `…以 / 上（韓国の定価）` | `リップスリーピン / グマスク` |

캡처: `docs/predeploy/shots/vfy-ja-se3-beauty.png`(범례 `（韓 / 国の定価）`, 1위 카드 근거 줄 `評価33 / 票`도 보임), `vfy-ja-se3-awards-lip.png`, `vfy-ja-ip13-dokudami.png`. QA가 적은 `shots/wk-se-ja-beauty.png` 는 저장소에 없다.

글꼴은 ja 가 `-apple-system, "Hiragino Sans"`(`apps/web/src/app/globals.css:326`)라 iOS와 같고, 가타카나는 전각 폭이라 줄이 끊기는 자리는 글자 크기·칸 폭으로만 정해진다. 데이터는 정적 JSON(`src/data/beauty/text/ja.json`)이라 DB 장애와도 무관하다. **운영에서도 똑같이 나온다.**

## 2. 원인

| 부분 | 근거 | 설명 |
|---|---|---|
| 제품명 | `components/guide/Words.tsx:7`, `components/Phrase.tsx:21` (`[word-break:keep-all] [overflow-wrap:anywhere]`) | BudouX 는 `リップスリーピングマスク` 를 한 덩어리로 본다(`["リップスリーピングマスク"]`). keep-all 로 끊을 곳이 없어지고 칸(110~165px)보다 길면 `overflow-wrap:anywhere` 가 아무 글자에서 끊는다. `Words.tsx:3-4` 주석에 적힌 대비책이다 |
| 금칙 위반 | `globals.css:340-345` (`.title { line-break: strict }`), `CoverArt.tsx:80` (`p.title`) | anywhere 로 끊을 때는 strict 금칙을 무시한다. 가장 흔한 폭인 390에서 `ールクレンジング` 처럼 **장음 'ー'가 줄 맨 앞**에 온다. keep-all 을 빼면(`word-break:normal` 주입) 같은 카드가 `ドクダミポアコント / ロールクレンジング / オイル` 로 바뀌고 금칙 위반은 0건이 된다 |
| 데이터 표기 | `data/beauty/text/ja.json:52,262` 등 | ja 제품명 65개 중 39개는 이미 단어마다 띄어 쓴다(`アドバンスド スネイル96 ムチン パワーエッセンス`, `プロ アイ パレット エアー`). 띄어쓰기 없는 긴 가타카나는 약 10개다: `ドクダミポアコントロールクレンジングオイル`, `ウォータースリーピングマスク`, `コラーゲンナイトラッピングマスク`, `リップスリーピングマスク`, `ジューシーラスティングティント`, `リップグロウイバーム`, `マスクフィットレッドクッション`, `ベターザンパレット`, `パーフェクトヘアフィルアップ` 등. clinic 은 `レーザートーニング`, travel 은 `YGエンターテインメント本社` |
| 가격 범례 | `app/[locale]/beauty/page.tsx:113`, `awards/[category]/page.tsx:112`, `p/[slug]/page.tsx:169`, `components/beauty/MethodNote.tsx:20` | `Words` 를 쓰지 않아서 일본어 기본 줄바꿈(글자 사이 어디서나)을 따른다. 같은 화면의 소개문(`beauty/page.tsx:103`)은 `Words` 를 쓴다 |

## 3. 설계 의도인가

| 문서 | 내용 | 판단 |
|---|---|---|
| `docs/monetize/DESIGN.md:198` | "CJK 줄바꿈: 제목은 `<Phrase>`(budoux) + 전역 `line-break: strict`" | 제품명은 **제목이라 의도 범위 안**이다. 지금 동작은 의도(구 단위 + strict 금칙)를 어긴다 |
| `docs/monetize/REVIEW-LEFT.md:22` | ja 저장함 제품명 `スージングトナ/ー`, `ムチ/ン` 을 '낮음·디자인' 결함으로 보고 고침 | 같은 종류를 팀이 결함으로 처리한 선례 |
| `Words.tsx:3-4` 주석 | "한 단어가 칸보다 길 때만 아무 데서나 끊는다" | 칸이 넘치지 않게 하려는 최후 대비책일 뿐, 단어 중간 끊김을 원한다는 결정은 아니다 |
| 가격 범례 | DESIGN.md 는 '제목'만 규정한다 | 본문성 한 줄이라 기본 줄바꿈도 규칙 위반은 아니다. `（韓 / 国` 은 일본어 조판(JIS X 4051)에서도 허용되는 자리다. **이 절반은 미관 문제일 뿐이다** |

## 4. QA 고침안 점검

| QA 안 | 측정 | 판단 |
|---|---|---|
| `リップ スリーピング マスク` 로 띄어쓰기 | 맞는 방향이다. 다만 같은 문제가 약 10개 이름에 있고, 390폭의 'ー' 줄머리 위반은 `ドクダミ…` 카드에서 난다 | **하나만 고치면 부족하다.** 긴 가타카나 이름을 같은 표기(단어마다 공백, 39개와 같은 방식)로 맞춘다 |
| `priceLegend` 를 `<Words>` 로 감싸기 | 브라우저 안에서 같은 마크업(keep-all span + BudouX `["…以上","（韓国の","定価）"]` 사이 `<wbr>`)으로 바꿔 측정: SE3·iPhone 13 모두 **`…3万ウォン以上（ / 韓国の定価）`** | **오히려 나빠진다.** WebKit 은 keep-all 일 때 여는 괄호를 줄 끝에 남긴다(`qa-flows.md:62` #2와 같은 버그). 지금 iPhone 13(390)은 `（韓国 / の定価）` 로 괜찮은데, 고치면 가장 흔한 폭에서 괄호가 줄 끝에 남는다 |

## 5. 권장 고침 (배포를 막지는 않음)

| 순서 | 할 일 | 파일 | 품 |
|---|---|---|---|
| 1 | 띄어쓰기 없는 긴 가타카나 제품명 약 10개를 단어마다 띄어 쓴다(예: `ドクダミ ポアコントロール クレンジングオイル`, `リップ スリーピング マスク`, `マスクフィット レッドクッション`). 필요하면 clinic `レーザートーニング`, travel `YGエンターテインメント 本社` 도 | `apps/web/src/data/beauty/text/ja.json` (`:52`, `:262` 등) | S(30분) |
| 2 | 가격 범례는 `Words` 로 감싸지 않는다. `qa-flows.md` #2(여는 괄호를 다음 글자와 `nowrap` 으로 묶기)를 먼저 고친 뒤 감싸거나, 문구를 `韓国の定価：₩ 1万ウォン未満・…` 처럼 괄호 없이 앞으로 옮긴다 | `apps/web/messages/ns/Beauty/ja.json:11` | S |
| 3 | (선택) 1을 한 뒤에도 남는 긴 단어는 'ー'·작은 가나가 줄머리에 오지 않게, ja 에서는 `Words` 의 keep-all 을 빼고 strict 금칙에 맡기는 것을 검토 | `components/guide/Words.tsx:7`, `components/Phrase.tsx:21` | S~M |

## 6. 다시 확인하는 법

```bash
cd apps/web && NODE_PATH=$PWD/node_modules:$PWD/../../node_modules \
  node /tmp/verify-ja-wrap/lines.cjs webkit "iPhone SE (3rd gen)" /ja/beauty   # 범례·제품명 줄 나눔 출력
node /tmp/verify-ja-wrap/variant.cjs "iPhone 13" /ja/beauty                    # keep-all 유무별 금칙 위반 수
node /tmp/verify-ja-wrap/legend-sim.cjs                                        # 범례에 Words 를 씌웠을 때 모의
```

스크립트는 글자마다 `Range.getClientRects()` 의 top 으로 줄을 나눈다. 고친 뒤에는 `リップスリーピン / グマスク`, `（韓 / 国`, 'ー' 줄머리가 0건이어야 한다.
