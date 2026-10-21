# 제품 이미지 — 어디서 정당하게 가져오나 (2026-10-21)

사장님 질문: "대표 제품이 있으면 그 제품 이미지를 받아서 올리면 안 돼? 쿠팡파트너스 이미지 기능, 올리브영(링크인피알), 네이버 쇼핑 커넥트 쪽을 찾아봐."

## 결론

- **쇼핑몰·브랜드 사이트 사진을 내려받아 올리면 안 된다.** 조사한 26개 브랜드 공식몰이 모두 '사전 승낙 없는 영리목적 복제·배포 금지'(공정위 표준약관 제22조형) 또는 'personal, non-commercial use only' 조항을 둔다. 애드센스가 붙은 사이트는 영리 목적으로 볼 여지가 크다.
- **쿠팡·올리브영·네이버 쇼핑 커넥트·네이버 검색 API 중 우리 카드 디자인 안에 제품 사진을 넣을 권리를 주는 곳은 없다.** 쿠팡만 '광고 칸(iframe)을 고치지 않고 그대로' 거는 방식으로 제품 이미지를 보여 줄 수 있고, 국내 배송이라 한국어 페이지에만 의미가 있다.
- **지금 넣은 것:** Open Beauty Facts에 올린이가 직접 찍은 CC BY-SA 사진 5장에서 제품만 오려 냈다. 상세에는 저작자 표기를 단다. 50개를 다 채우는 길은 아래 셋이다: ① 직접 촬영(스크립트 준비됨) ② 브랜드 서면 허락 ③ YesStyle(Awin) 상품 피드(조건부).

## 채널별 판정

| 채널 | 이미지 제공 | 우리 카드에 쓰기 | 근거 |
|---|---|---|---|
| 쿠팡 파트너스 | 있음. 상품 링크 '이미지+텍스트' HTML·다이나믹 배너 iframe, Open API `productImage`(최종 승인 뒤) | **불가.** 광고 칸 그대로만. 저장·수정·커버형 배너 금지, API 응답 저장 금지(노출마다 실시간 호출, 분당 50회, 넘으면 24시간 차단) | 약관 8조②9·14호, API 약관 5조, 운영정책 4.1, 공지 35·160·187 |
| 올리브영 (링크인피알·쇼핑 큐레이터·글로벌 Affiliate) | 없음(링크만). 링크인피알에 올리브영 캠페인이 있다는 근거 없음 | 불가 | 국내 약관 29조②, 글로벌 Legal Information·약관 Art.14 |
| 네이버 쇼핑 커넥트 | 없음(`naver.me` 텍스트 링크만). 연동 채널이 블로그·클립·인스타·유튜브라 독립 웹사이트 사용도 미확인 | 불가 | 약관 8조① |
| 네이버 검색 API(쇼핑) | 2026-07-31 종료 | 불가(종료 전에도 광고 페이지·수익화 금지) | 특약 2.3 |
| Amazon (Creators API, PA-API 5.0 은 2026-05 종료) | API 이미지 | **불가.** 각 사용을 Amazon 상품 페이지로만 링크, 모바일 최적화 사이트는 사전 서면 승인 필요, 최근 30일 판매 10건 조건 | IP License §1·§2(c)(d), API Rates |
| YesStyle (Awin 프로그램 63156) | Awin 상품 피드 이미지(`awin_image_url`) | **조건부.** 내려받지 말고 Awin 이미지 서비스 주소에 `w·h·t=letterbox` 를 붙여 걸고, 그 제품 상세에 YesStyle 추적 링크를 둔다. 프로그램 약관은 가입 뒤에만 보여서 서면 확인 필요 | Awin 표준 약관 §10.1·§4.6 |
| Open Beauty Facts | CC BY-SA 3.0 (올린이 사진) | **가능.** 저작자·라이선스·출처·수정 표기. 단 쇼핑몰 사진을 퍼 온 업로드는 라이선스 무효라 뺀다 | OBF 라이선스 |

상세 근거·원문 인용은 이번 조사 원본(세션 기록)에 있다. 핵심 원문만 옮긴다.

- 쿠팡 API 약관 제5조: "API 서비스 이용에 대한 회사의 승인이 저작권 또는 관련 데이터 이용에 대한 권리를 이용자에게 부여하는 것을 의미하지 않습니다. … 데이터를 복제, 저장 또는 전송할 수 없습니다." (partners.coupang.com 약관 2026.9.7판)
- 쿠팡 약관 제8조②9호: "쿠팡 파트너스에 등록되지 않은 미디어를 통해 프로그램에 참여하는 행위"
- 올리브영 글로벌 Legal Information: "any unauthorized use of content on this website including modification, distribution, republishing, transmission, and display is considered a violation of copyright"
- Amazon IP License §2(c)(iii): Product Advertising Content 는 Amazon 의 해당 페이지로만 링크한다.

## 지금 넣은 것: Open Beauty Facts CC 사진 5장

| 제품 | OBF 바코드·원본 | 올린이 |
|---|---|---|
| COSRX 로우 pH 굿모닝 젤 클렌저 | 8809416470511 / 1 | Open Beauty Facts contributors |
| 토리든 다이브인 세럼 | 8809504741653 / 1 | smoothie-app |
| 라네즈 립 슬리핑 마스크 | 8809643053273 / 1 | Open Beauty Facts contributors |
| 티르티르 마스크 핏 레드 쿠션 | 8809928135892 / 1 (270도 회전) | Open Beauty Facts contributors |
| 조선미녀 인삼 아이세럼 | 8809738316146 / 4 | foodless |

- 고른 방법: OBF 에서 50개 제품을 이름·브랜드로 찾아 후보 42건(25개 제품) → 원본 업로드의 올린이·해상도·촬영 장면을 보고 '직접 찍은 사진'만 남김 → 사진에서 제품 이름을 읽어 변형까지 같은지 확인 → macOS Vision 으로 제품만 오려 냄 → 다른 에이전트가 원본·결과를 다시 보고 검증.
- 뺀 것: `jaksel`(600×600)·`thaialagata`(750·800px)처럼 여러 브랜드의 흰 배경 상품컷을 같은 규격으로 올린 업로드는 쇼핑몰 사진을 퍼 온 것으로 보고 제외. 일리윤 크림·라도 헤어 필업은 손가락이 같이 오려져서 제외. 나머지는 다른 변형(예: 조선미녀 선크림 아쿠아프레쉬 ≠ 쌀+프로바이오틱스)이거나 앞면이 잘린 사진.
- 화면: 오려 낸 사진을 3D 아이콘과 같은 회색 면 위에 세운다(`CoverSpec` 의 `product`). 상세 히어로 아래에 `Photo: … · CC BY-SA 3.0 · Open Beauty Facts · background removed`. 상품 구조화 데이터(`Product.image`)에도 넣는다.
- 만들기: `node apps/web/scripts/product-photo.mjs` (목록 `apps/web/scripts/product-photos.json` → `public/products/<slug>.webp` + `src/data/beauty/photos.ts`). 맥에서만 돈다(Vision).

## 50개를 채우는 길

### ① 직접 촬영 — 가장 빠르고 확실

- 사진 저작권이 우리에게 생긴다(패키지 디자인·상표가 찍히는 것은 제품 소개 목적이라 위험이 낮지만 법률 판단은 아니다).
- 찍는 법: 단색 바닥(흰 종이·회색 천), 앞면 전체가 보이게, 손 없이, 휴대폰 기본 카메라. 올리브영 매장이면 직원에게 허락을 받는다.
- 넣는 법: `product-photos.json` 에 `{ "slug": "…", "file": "/절대/경로.jpg" }` 를 더하고 스크립트를 돌린다. 직접 찍은 사진은 저작자 표기가 붙지 않는다.

### ② 브랜드 서면 허락

공개된 프레스 키트는 없다(MISSHA 'PARTNER ZONE' 은 로그인 필요). 4개 그룹이 50개 중 32개를 차지하니 이 순서로 보낸다.

| 그룹 | 제품 수 | 보낼 곳 |
|---|---|---|
| 아모레퍼시픽 (COSRX 3·LANEIGE 3·AESTURA 2·ILLIYOON 2·innisfree 2·HERA 1·mise en scène 1) | 14 | COSRX `cosrx_info@cosrx.co.kr`, innisfree `partner.biz@innisfree.com`, 본체 5개 브랜드는 공개 PR 주소가 없어 `illiyoonmall_official@amorepacific.com` 에 '홍보 부서 전달' 요청 또는 미국 `laneige@apus.amorepacific.com` |
| 구다이글로벌 (조선미녀 4·SKIN1004 3·Round Lab 3·TIRTIR 1) | 11 | `prskin1004@skin1004korea.com`, `partners@beautyofjoseon.com`, `contact@tirtir.co.kr`, `sales@roundlab.co.kr` (같은 문안, '4개 브랜드 공통 요청' 명시) |
| APR (medicube) | 4 | `hello@medicube.us` (PR + Wholesale) |
| 클리오 (CLIO 2·peripera 1) | 3 | `hnlee@clio.co.kr`, `hj_kim1127@clio.co.kr` |
| 그 밖 | 18 | Anua `business@anua.kr`, Torriden `global@torriden.com`, BANILA CO `hello@banilausa.com`, rom&nd `romandyou@romand.co.kr`, BIODANCE `contact_global@beautyselection.co.kr`, d'Alba `biz_korea@dalba.com`, MEDIHEAL `help@medihealcos.com`, mixsoon `b2binquiry@pkcosm.com`, ma:nyo 제휴문의 폼, La'dor `export@lador.co.kr`, belif LG생활건강 문의 폼, MISSHA 대표 02-2199-0123 |

메일에 넣을 범위(빠지면 나중에 철회되기 쉽다): 사이트 소개(9개 언어, 1인 운영, 애드센스·제휴 링크가 있다는 사실) / 원하는 것(모델 없는 패키지 단독 컷 원본) / 쓰는 곳(카드·상세·공유 미리보기, 검색 이미지 노출) / 자체 서버 저장 / 가공(크기·WebP·자르기·배경 제거, 로고·문구·색은 바꾸지 않음) / 9개 언어 / 광고와 같은 화면에 나오지만 광고 소재로는 쓰지 않음 / 기간·철회 시 7일 안 삭제·리뉴얼 시 교체 / 출처 표기 문구 / 비독점·무상 / '이 메일에 동의 회신'으로 끝.

메일 초안(한국어):

> 제목: [Unnie Note] {브랜드} 제품 이미지 사용 허락 요청
>
> 안녕하세요, 외국인을 위한 K-컬처 가이드 Unnie Note(https://unnienote.app)를 운영하는 ○○○입니다. 9개 언어로 한국 스킨케어를 고르는 법과 순위를 소개하고 있고, {제품명}을 {분류} 대표 제품으로 싣고 있습니다.
> 지금은 제품 사진 대신 아이콘을 쓰고 있어, 공식 패키지 단독 컷(모델 없는 원본 파일)을 아래 범위로 써도 될지 허락을 구합니다.
> - 쓰는 곳: 제품 카드·상세 페이지 상단·공유 미리보기 이미지(검색엔진 이미지 결과에 보일 수 있음), 9개 언어 페이지
> - 저장·가공: 저희 서버에 저장하고, 크기 조절·WebP 변환·배경 제거만 합니다. 로고·문구·색은 바꾸지 않습니다
> - 사이트에는 애드센스 광고와 구매처 제휴 링크가 있습니다. 이미지를 광고 소재로 쓰지는 않습니다
> - 출처 표기: 'Product image courtesy of {브랜드}' (원하시는 문구가 있으면 따르겠습니다)
> - 비독점·무상이며, 요청하시면 7일 안에 내리고 패키지가 바뀌면 새 이미지로 교체합니다
> 이 메일에 동의한다고 회신해 주시면 됩니다. 감사합니다.

### ③ YesStyle 상품 피드 (Awin) — 조건부

Awin 퍼블리셔 가입(환불되는 보증금 약 1달러) → YesStyle 글로벌 프로그램(63156) 신청 → 승인 뒤 프로그램 약관을 읽고 'Awin 피드 이미지를 카드에 걸고, 상세에 YesStyle 추적 링크를 둔다'는 사용 방식을 Awin 메시지로 서면 확인. 확인되면 이미지는 내려받지 않고 Awin 이미지 서비스 주소를 그대로 건다(`CoverSpec` 에 새 종류가 필요하다).

## 쿠팡: 이번에 고친 것과 남은 것

- **배너를 껐다.** 코드에는 `unnienote.app` 이 '파트너스에 등록한 미디어'로 들어가 있었지만 '미디어 관리' 등록은 개인 할 일 목록에 아직 열려 있었다. 등록하지 않은 미디어에 광고를 내면 약관 8조②9호 위반(제재 A등급: 1회 최근 14일 수익 몰수, 2회 해지)이라 `COUPANG_MEDIA_HOSTS` 에서 뺐다. 등록하면 다시 넣는다(`src/lib/ads.ts`, 테스트 한 줄).
- 쿠팡 제품 이미지는 한국어 뷰티 상세에 '광고' 칸(대시보드에서 만든 상품별 태그 그대로 + 칸 위와 글 첫 부분에 대가성 문구)으로만 둘 수 있다. 미디어 등록 뒤에 할 일.
- 뉴스 지면에 해당하는지(`tsource`), 승인 기준(15만 원 판매인지 1만 원 수익인지)은 미확인이라 partners@coupang.com 에 물어볼 것.
