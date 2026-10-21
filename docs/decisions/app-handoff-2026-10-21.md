# 언니노트 앱 스토어 제출 — 인수인계 (2026-10-21)

## 상태
- Play: 앱 생성(4972286698390191448, bredy_dev 개인 계정 콘솔 u/3), 등록정보·선언 전부 완료, AAB versionCode 6 비공개 테스트(alpha)·내부 테스트 초안 → **검토 중**. 프로덕션은 테스터 12명×14일 뒤 신청.
- iOS: 번들 ID 등록, EAS 빌드 완료(빌드 f9684a26…, buildNumber 2 추정). **App Store Connect 로그인(사용자 2단계 인증) 대기** — 앱 레코드는 웹에서만 생성 가능.

## 로그인 뒤 할 일 (iOS)
1. ASC 웹에서 새 앱: 이름 Unnie Note, 기본 언어 영어(미국), 번들 app.unnienote.mobile, SKU unnienote-ios.
2. `mobile/eas.json` submit.production.ios 에 ascAppId·appleTeamId(J5F7Z4S89D) 넣고 `eas submit -p ios --profile production --id f9684a26-cb77-46de-a180-ad8d686a111c` (키: ~/.appstoreconnect/eas.env).
3. `node mobile/scripts/asc-setup.mjs <meta|rating|price|review|shots|submit> --app <APP_ID> [--build N]` (메타데이터·스크린샷은 ~/Desktop/unnienote-store/ — 스크립트 안 /tmp/unnie-store 경로를 이 폴더로 바꿔 쓸 것).
4. App Privacy(웹): 사용 데이터(제품 상호작용), 진단(충돌·성능), 대략적 위치 — 사용자와 연결 안 됨, 추적 아님.
5. DSA 거래자 정보(EU 포함 결정): 공개 주소·전화·이메일은 사용자에게 받기.

## 참고
- 도구: Play API `/tmp/unnie-tools/play.mjs`(서비스 계정 ~/Downloads/breeder-1901f-…json), 사용자 크롬 조작 user-chrome-control 스킬.
- 남은 개선: 안드로이드 탭 라벨 항상 보이기(labelVisibilityMode), 상세 문서 app-2026-10-21.md §10·§11.
