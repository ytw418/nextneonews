# 검증: 피부 타입 테스트에 이름이 'Back'인 버튼이 2개 있다

- 판정: **재현됨(real=true), 심각도 낮음**. 9개 언어 중 7개에서 헤더의 '뒤로'(테스트 나가기)와 '이전 문항' 버튼의 접근성 이름이 같다.
- 확인 환경: `http://localhost:3400` (dev 최신 빌드, 커밋 `1bb6006`), Playwright 1.64.1 Chromium, `iPhone 13` 에뮬레이션. 코드는 고치지 않았다.

## 1. 재현 결과 (2번 문항에서 버튼 이름 확인)

| 언어 | 헤더 뒤로 (`Nav.back`) | 테스트 이전 문항 (`Beauty.quiz.back`) | 이름 중복 |
|---|---|---|---|
| en | Back | Back | **2개** |
| ja | 戻る | 戻る | **2개** |
| fr | Retour | Retour | **2개** |
| id | Kembali | Kembali | 중복(문구 기준) |
| ru | Назад | Назад | 중복(문구 기준) |
| vi | Quay lại | Quay lại | 중복(문구 기준) |
| ko | 뒤로 | 이전 | 없음 |
| zh-TW | 返回 | 上一題 | 없음 |
| zh-CN | 返回 | 上一题 | 없음 |

- en·ja·ko·zh-TW·fr 는 브라우저로 확인했다. id·ru·vi 는 메시지 파일(`apps/web/messages/{l}.json` 의 `Nav.back`, `apps/web/messages/ns/Beauty/{l}.json` 의 `quiz.back`)이 같은 문구라서 같은 결과로 본다.
- 첫 문항에서는 '이전' 버튼이 없어서(`Quiz.tsx:117` `step > 0`) 중복이 없다. 보기를 하나 고르면 그때부터 생긴다.

## 2. 영향 확인

| 확인 | 결과 |
|---|---|
| `getByRole('button',{name:'Back',exact:true})` | 2개, 클릭 시 strict mode violation |
| 첫 번째 'Back'(헤더) 클릭 | `/en/beauty/skin-type` → `/en/beauty` 로 나감 |
| 다시 들어오면 | `Question 1 of 6` — 진행이 사라짐(`Quiz.tsx:32-35` 상태가 `useState` 뿐, 저장 없음) |

- 눈으로 보는 사용자는 헤더가 화살표 아이콘이고 테스트 버튼은 글자라서 헷갈릴 일이 적다.
- 영향은 VoiceOver(로터의 버튼 목록에 'Back'이 둘)와 음성 제어("Tap Back" 때 번호를 다시 골라야 함) 사용자에게 한정된다. 잘못 고르면 테스트를 나가고 진행이 지워진다.

## 3. 설계 의도인가

| 근거 | 내용 |
|---|---|
| `docs/monetize/DESIGN.md:155` | 테스트 버튼을 "뒤로" `Button size="m" variant="neutral"` 로만 적었다. 헤더와 같은 이름을 쓰라는 결정은 없다 |
| ko·zh 번역 | `이전`, `上一題/上一题` 로 이미 '이전 문항' 뜻으로 구분했다 → 의도는 '이전 문항'이고 en·ja·fr·id·ru·vi 번역만 일반 '뒤로'로 옮겨졌다 |
| 도입 커밋 | `32b5dfe feat: 뷰티 — 언니 어워드·제품 상세·피부 타입 테스트 (9개 언어)` 에서 같이 들어왔다 |

설계상 의도로 볼 근거가 없고, 로컬 환경과도 무관하다(문구가 빌드에 그대로 들어간다).

## 4. 고치는 방법 (배포 막지 않음)

`apps/web/messages/ns/Beauty/{en,ja,fr,id,ru,vi}.json` 의 `quiz.back` 한 줄씩만 바꾼다. 코드 변경 없음.

| 언어 | 지금 | 바꿀 문구(예) |
|---|---|---|
| en | Back | Previous question |
| ja | 戻る | 前の質問 |
| fr | Retour | Question précédente |
| id | Kembali | Pertanyaan sebelumnya |
| ru | Назад | Предыдущий вопрос |
| vi | Quay lại | Câu trước |

- 버튼은 `size="m"` 이고 블록이 아니라서 문구가 길어져도 한 줄에 들어간다(390px 폭 기준, 확인은 수정 후 화면으로).
- 테스트: 문구 변경이라 새 테스트는 쓰지 않는다(개인 규칙 §4.5.1).

## 5. 재현 명령

```bash
# 스크립트: /tmp/qa-quiz-back/run.cjs (5개 언어 버튼 이름), /tmp/qa-quiz-back/exit.cjs (헤더 Back 으로 나가기·진행 사라짐)
node /tmp/qa-quiz-back/run.cjs
node /tmp/qa-quiz-back/exit.cjs
```
