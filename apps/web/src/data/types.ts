// 정적 카탈로그(뷰티·여행·클리닉·드라마) 공용 타입. 언어 무관 사실은 <section>/items.ts, 언어별 문구는 <section>/text/{locale}.json.
// 이 파일은 타입만 둔다 — 클라이언트 컴포넌트도 import 할 수 있다 (카탈로그 자체는 서버 전용 로더로만 읽는다)

import type { Icon3d } from "./icons3d";

export type Section = "beauty" | "travel" | "clinic" | "drama";

// 저장(하트) 종류. 여행은 명소 단위로 저장해서 place
export type SavedKind = "article" | "beauty" | "place" | "clinic" | "drama";

// 제휴·시청 플랫폼의 판매·서비스 지역. global 은 어디서나
export type Region = "tw" | "hk" | "jp" | "us" | "sg" | "my" | "ph" | "id" | "vn" | "fr" | "global";

export type AffiliatePartner = "oliveyoung" | "yesstyle" | "amazon" | "klook" | "creatrip" | "trip" | "airalo";

// url 은 파트너 사이트의 보통 주소. 추적 링크는 lib/affiliate.ts 가 환경변수로 만든다
export interface AffiliateTarget {
  partner: AffiliatePartner;
  url: string;
  regions?: Region[]; // 이 지역에서만 산다(배송한다). 없으면 어디서나
}

// 위키미디어 공용 CC 사진 (여행 명소·동네). 커스텀 이미지 로더(lib/image.ts)가 화면 폭에 맞는 썸네일을 고른다.
// 저작자 표기 필드는 뉴스 사진 표기(PhotoCredit)와 같은 이름이다. 메타는 scripts/commons-photo.mjs 가 채운다
export interface CoverPhoto {
  url: string; // https://upload.wikimedia.org/wikipedia/commons/a/ab/파일 (원본 주소)
  width: number; // 원본 크기 (로더가 원본보다 큰 썸네일을 고르지 않게)
  height: number;
  author: string | null;
  licenseName: string;
  licenseUrl: string | null;
  sourceUrl: string; // 공용 파일 설명 페이지
}

// 제품 사진 (뷰티). 제품만 오려 낸 투명 WebP 를 public/products/ 에 둔다 — 브랜드·쇼핑몰 상품 사진은 저작물이라 쓰지 않는다.
// 출처는 둘: Open Beauty Facts 에 올린이가 직접 찍은 사진(CC BY-SA, 표기 필요) 또는 운영자가 직접 찍은 사진(표기 없음).
// 파일과 메타는 scripts/product-photo.mjs 가 만든다
export interface ProductPhoto {
  src: string; // /products/<slug>.webp
  width: number; // 오려 낸 파일 크기
  height: number;
  author: string | null; // 올린 사람 (OBF 사용자 이름). 직접 찍은 사진은 null
  licenseName: string | null; // CC BY-SA 3.0. 직접 찍은 사진은 null
  licenseUrl: string | null;
  sourceUrl: string | null; // OBF 제품 페이지. 직접 찍은 사진은 null — 저작자 표기를 하지 않는다
  sourceName: string | null; // Open Beauty Facts
}

// 사진이 없는 자리에 그리는 것: 3D 아이콘, CC 사진(명소·동네), 오려 낸 제품 CC 사진 (규칙은 data/cover.ts 한 곳)
export type CoverSpec =
  { kind: "icon"; icon: Icon3d } | { kind: "photo"; photo: CoverPhoto } | { kind: "product"; photo: ProductPhoto };

// 저장함·교차 레일·가이드 허브가 쓰는 항목 한 줄 요약
export interface CatalogSummary {
  kind: SavedKind;
  id: string;
  href: string; // 언어 접두사 없는 앱 경로 (/beauty/p/x). Link 가 언어를 붙인다
  title: string;
  sub?: string;
  tint: string; // "var(--tint-kbeauty)" 처럼 CSS 변수
  badge?: "new"; // addedAt 14일 이내
  lang?: string; // 제목이 화면 언어와 다를 때 그 언어 (이 언어 번역이 아직 없는 글 → 영어 제목)
  cover: CoverSpec;
}
