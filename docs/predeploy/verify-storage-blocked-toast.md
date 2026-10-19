# 검증: 저장소가 막힌 브라우저에서 첫 저장 토스트 안내가 틀리다는 보고

- 대상: `http://localhost:3400`(로컬 운영 빌드, 로컬 DB). 코드는 고치지 않았다.
- 보고: `docs/predeploy/qa-edge.md:28`(12번, 낮음, UX)
- 판정: **real=false (배포 전에 고칠 버그가 아니다)**. 심각도를 굳이 매기면 낮음.

## 결론 한 줄

사파리 사생활 보호 모드에서는 저장소가 막히지 않는다. 그래서 보고서가 전제한 상황이 실제로는 생기지 않는다. 저장소가 정말 막히는 경우('모든 쿠키 차단'을 켠 극소수 사용자)도 이번 방문 동안만 메모리에 두는 동작은 설계에서 정한 것이다. 첫 저장 토스트도 이미 "잃어버리지 않게 링크를 나에게 보내 두세요"라고 안내하고 그 버튼까지 보여 준다.

## 재현 결과 (WebKit, iPhone 15 에뮬레이션, `/en/beauty/p/anua-heartleaf-77-soothing-toner`)

스크립트: `/tmp/verify-storage-private/run.mjs`(저장소 밖에 둔 임시 파일). 실행: `node run.mjs`

| 항목 | A. 저장소 막힘 흉내(QA 방식: `localStorage` getter가 `SecurityError`를 던지게 함) | B. WebKit 기본 비영속 컨텍스트(사생활 보호와 가장 비슷함) |
|---|---|---|
| 저장 직후 `aria-pressed` | true | true |
| 첫 저장 토스트 | "Saved on this browser only. Send yourself the link so you don't lose it." + `Copy link` | 같은 문구·버튼 |
| `localStorage.getItem("hb:saved")` | `THROWS SecurityError` | `[{"kind":"beauty","id":"anua-…","at":…}]` |
| 새로고침 뒤 저장 상태 | **false(사라짐)** | **true(남아 있음)** |
| 새로고침 뒤 `/en/saved` h1 | "Saved"(개수 없음, 빈 상태) | "Saved 1 item" |
| 페이지 오류 | 0 | 0 |

A는 QA 결과와 같게 재현된다. B처럼 실제 비영속 WebKit에서는 새로고침해도 저장이 남는다.

## 왜 real=false 인가

| 근거 | 내용 |
|---|---|
| 보고의 전제가 틀렸다 | Safari 11 무렵(WebKit bug 157010, STP 29, 2017-05)부터 사생활 보호 모드의 `localStorage`는 메모리에서 읽고 쓰기가 되고, 탭을 닫을 때 지워진다. 새로고침해도 남는다. 위 B의 측정 결과와 같다. 출처: https://bugs.webkit.org/show_bug.cgi?id=157010 , https://webkit.org/blog/7532/release-notes-for-safari-technology-preview-29/ |
| 제안한 수정은 사생활 보호 모드를 잡지 못한다 | 사생활 보호 모드에서는 `setItem`이 성공한다. 그래서 `storageSet`이 boolean을 돌려줘도 실패가 나오지 않고, '사생활 보호 모드라 창을 닫으면 사라져요' 문구는 정작 그 사용자에게 뜨지 않는다. 반대로 이 문구가 뜨는 경우('모든 쿠키 차단')에는 사생활 보호 모드가 아니므로 이유를 잘못 알려 준다 |
| 실제로 막히는 경우는 드물다 | `localStorage` 접근이 `SecurityError`를 던지는 것은 Safari 설정 '모든 쿠키 차단'이나 크롬의 사이트 데이터 차단처럼 사용자가 직접 켜는 경우다. 이 설정을 켜면 다른 사이트도 대부분 깨진다 |
| 메모리 대체는 설계에서 정한 것이다 | `apps/web/src/lib/saved.ts:11`("이번 방문 동안 메모리에 둔다"), `saved.ts:120-121`(메모리에 먼저 두고 `storageSet` 호출), `docs/monetize/PLAN.md:187`(`storageGet/Set` + 메모리 폴백) |
| 안내는 이미 같은 행동을 시킨다 | 첫 저장 토스트(`apps/web/src/components/SaveButton.tsx:55-62`, `messages/ns/Engage/en.json:84`)는 "Send yourself the link so you don't lose it" + `Copy link`(ja·zh-TW는 LINE) 버튼을 8초 동안 보여 준다. 수정안이 기대한 효과('바로 나에게 보내기를 쓰게 한다')를 이미 내고 있다. 설계 결정은 `docs/monetize/BM-VALIDATION.md:157` |
| 나에게 보내기는 막힌 상태에서도 된다 | `sendSavedList`(`apps/web/src/components/saved/sendList.ts:36-58`)는 `readSaved()`(메모리 값)로 `?i=` 링크를 만들어 클립보드나 LINE으로 보낸다. 저장소를 쓰지 않는다 |

## 남는 차이 (참고, 배포를 막지 않음)

| 차이 | 영향 | 하려면 |
|---|---|---|
| 저장소가 막힌 경우 "this browser only"는 사실 "이번 방문에만"이다 | '모든 쿠키 차단'을 켠 사용자만 해당한다. 토스트가 이미 링크 보내기를 권하므로 실제로 잃는 경우는 드물다 | 하려면 배포 뒤 한가할 때: `storageSet`이 성공 여부를 돌려주게 하고, 실패하면 '이 브라우저는 저장을 막아 두어 새로고침하면 사라져요' 같은 문구를 쓴다. '사생활 보호'라는 말은 쓰지 않는다 |
