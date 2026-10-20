import type { Icon3d } from "../icons3d";
import type { CoverPhoto } from "../types";

export type AreaSlug =
  | "seongsu"
  | "hongdae"
  | "myeongdong"
  | "hannam-itaewon"
  | "apgujeong-cheongdam"
  | "bukchon-ikseon"
  | "yeouido"
  | "busan"
  | "jeju";

export const AREA_SLUGS: readonly AreaSlug[] = [
  "seongsu",
  "hongdae",
  "myeongdong",
  "hannam-itaewon",
  "apgujeong-cheongdam",
  "bukchon-ikseon",
  "yeouido",
  "busan",
  "jeju",
];

export type PlaceKind = "filming" | "idol" | "cafe" | "shop" | "photo" | "food" | "landmark";

export interface Place {
  slug: string;
  area: AreaSlug;
  kind: PlaceKind;
  lat: number;
  lng: number;
  mapUrl: string; // 구글 지도 검색 링크 (API 없음)
  station?: { name: string; line: string; walkMin: number }; // name 은 영문 역명
  related?: { dramas?: string[]; entityIds?: string[] }; // 드라마 slug · 위키데이터 Q-id
  hours?: string;
  photo?: CoverPhoto; // 위키미디어 공용 CC 사진. 없으면 icon → 종류 아이콘 (data/cover.ts)
  icon?: Icon3d;
  addedAt: string;
  sources: string[];
}

export interface PlaceText {
  name: string;
  summary: string;
  address: string;
  tips: string[]; // 2~3개
}
export interface AreaText {
  name: string;
  tagline: string;
  intro: string;
}

export type PrepKey = "esim" | "tmoney" | "airport" | "stay" | "tour";

// text/{locale}.json 한 파일의 모양
export type TravelText = {
  areas: Record<AreaSlug, AreaText>;
  places: Record<string, PlaceText>;
  prep: { title: string; items: Record<PrepKey, { label: string; sub: string }> };
};
