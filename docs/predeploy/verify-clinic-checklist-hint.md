# 검증: 시술 질문 안내가 '페이지를 저장하면 다시 찾는다'인데 체크는 새로고침하면 사라진다

검증일 2026-10-20 · 대상: 다른 QA 보고(심각도 '낮음', UX) · 로컬 운영 빌드 `http://localhost:3400`(`1bb6006`) · 코드는 고치지 않았다

## 결론

| 항목 | 판정 |
|---|---|
| 동작 재현 | **된다.** 체크한 뒤 새로고침하거나 저장함에서 다시 열면 체크가 모두 풀린다 |
| 안내가 틀렸나 | **아니다.** 안내는 체크가 남는다고 말하지 않는다. "Save this page to find the list again" — 다시 찾을 수 있는 건 **목록(페이지)**이다. 실제로 하트로 저장하면 저장함에서 그 시술 페이지와 질문 목록을 다시 연다 |
| 설계상 의도인가 | **그렇다.** `docs/monetize/PLAN.md:317` "병원에 물어볼 질문(체크리스트, **저장하면 저장함에서 다시 봄**)", `QuestionChecklist.tsx:19` 주석 "이 화면에서만, 저장하지 않는다" |
| 판정 | **real=false**(설계대로 동작하고 안내 문구도 사실과 맞다) |
| 배포 | 막지 않는다 |

## 재현 측정

Playwright WebKit, `iPhone 13` 기기 설정, 스크립트 `/tmp/qv-checklist/run.cjs`(저장소 밖).

| 단계 | 결과 |
|---|---|
| `/en/clinic/botox` 열기 | 질문 5개, 안내 `Tick each one as you ask it. Save this page to find the list again.` |
| 질문 1·2 체크 | 체크 2개. `localStorage`·`sessionStorage` 키 0개(체크는 저장하지 않음) |
| 새로고침 | 체크 0개 |
| 머리글 하트 `Save “Botox (botulinum toxin)”` 누르기 | `aria-pressed=true`, `localStorage["hb:saved"]=[{"kind":"clinic","id":"botox",...}]` |
| `/en/saved` 이동 | botox 링크 1개 있음 |
| 저장함에서 botox 다시 열기 | 페이지와 질문 5개가 다시 나온다. 체크는 0개 |
| 뒤로 → 앞으로 | 체크 0개 |

즉 안내가 약속한 것(저장하면 목록을 다시 찾는다)은 지켜지고, 체크 유지는 약속하지 않았다.

## 9개 언어 안내 문구 (`apps/web/messages/ns/Clinic/*.json` `questions.hint`)

| 언어 | 저장 뒤 다시 찾는 대상 | 체크 유지를 약속하나 |
|---|---|---|
| en | the list | 아니오 |
| fr | la liste | 아니오 |
| ko | 이 페이지 | 아니오 |
| ja | このページ(また開けます) | 아니오 |
| zh-TW / zh-CN | 這頁·本页(再打開) | 아니오 |
| vi / id / ru | trang này · halaman ini · страницу | 아니오 |

같은 컴포넌트를 쓰는 `/clinic/how-to-choose`의 안내(`ns/Clinic/pages/en.json:45` `questionsIntro`)도 "Save this page and bring the list to the clinic"으로, 페이지를 저장하라는 말뿐이다.

## 남는 점(버그 아님, 선택 사항)

| 내용 | 판단 |
|---|---|
| 영어·프랑스어 문장은 '체크하라' 바로 뒤에 '저장하라'가 와서 체크까지 저장된다고 읽힐 여지가 조금 있다 | 상담은 화면 하나를 연 채로 하는 흐름이라 새로고침할 일이 드물다. 문구를 바꾸려면 9개 언어를 함께 고쳐야 하므로 배포 뒤 여유 있을 때 검토 |
| 체크를 `sessionStorage`에 남기기 | 설계(`PLAN.md:317`)에 없는 기능 추가. 이번 배포 범위 밖 |
