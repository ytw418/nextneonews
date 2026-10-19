// 정적 카탈로그(뷰티·여행·클리닉·드라마) 공용 타입. 언어 무관 사실은 <section>/items.ts, 언어별 문구는 <section>/text/{locale}.json.
// 이 파일은 타입만 둔다 — 클라이언트 컴포넌트도 import 할 수 있다 (카탈로그 자체는 서버 전용 로더로만 읽는다)

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

// 저장함·교차 레일·가이드 허브가 쓰는 항목 한 줄 요약
export interface CatalogSummary {
  kind: SavedKind;
  id: string;
  href: string; // 언어 접두사 없는 앱 경로 (/beauty/p/x). Link 가 언어를 붙인다
  title: string;
  sub?: string;
  tint: string; // "var(--tint-kbeauty)" 처럼 CSS 변수
  badge?: "new"; // addedAt 14일 이내
}
