import type { BeautyCategory, BeautyProduct, SkinType } from "./beauty/types";
import type { Procedure } from "./clinic/types";
import type { Drama } from "./drama/types";
import { type Icon3d, SECTION_ICON } from "./icons3d";
import type { AreaSlug, Place, PlaceKind } from "./travel/types";
import type { CoverPhoto, CoverSpec, Section } from "./types";

// 가이드 커버 규칙은 여기 하나: 브랜드·쇼핑몰 제품 사진·드라마 포스터·병원 사진은 저작물이라 쓰지 않고, 3D 아이콘(data/icons3d.ts),
// 위키미디어 공용 CC 사진(여행 명소·동네), 올린이가 직접 찍은 제품 CC 사진을 오려 낸 것(뷰티, data/beauty/photos.ts)을 그린다.
// 쿠팡·올리브영·네이버가 주는 상품 이미지는 우리 커버로 쓸 권리가 없다 (docs/research/product-images-2026-10-21.md).
// 상세·목록·저장함·가이드 허브가 모두 이것을 쓴다.
// 서버·클라이언트(저장함) 모두에서 import 한다 — 카탈로그 데이터나 서버 전용 모듈을 들이지 않는다

// 대표 성분 아이콘(items.ts 의 icon)이 없는 제품은 분류 아이콘
export const BEAUTY_CATEGORY_ICON: Record<BeautyCategory, Icon3d> = {
  cleanser: "bubbles",
  toner: "droplet",
  serum: "test-tube",
  moisturizer: "jar",
  sunscreen: "sun",
  mask: "cucumber",
  lip: "kbeauty",
  base: "mirror",
  eye: "palette",
  "hair-body": "g-beauty",
};

// 사진도 아이콘도 없는 명소 (매장·사옥처럼 CC 사진이 없는 곳)
export const PLACE_KIND_ICON: Record<PlaceKind, Icon3d> = {
  filming: "kdrama",
  idol: "kpop",
  cafe: "coffee",
  shop: "life",
  photo: "camera",
  food: "kfood",
  landmark: "g-travel",
};

// 동네 타일: 사진이 없을 때 동네를 떠올리게 하는 것
export const AREA_ICON: Record<AreaSlug, Icon3d> = {
  seongsu: "coffee",
  hongdae: "guitar",
  myeongdong: "life",
  "hannam-itaewon": "globe",
  "apgujeong-cheongdam": "gem",
  "bukchon-ikseon": "lantern",
  yeouido: "blossom",
  busan: "beach",
  jeju: "tangerine",
};

// 피부 타입 진단 결과
export const SKIN_ICON: Record<SkinType, Icon3d> = {
  dry: "cactus",
  oily: "sweat",
  combination: "yin-yang",
  sensitive: "blossom",
  normal: "g-clinic",
};

export const iconCover = (icon: Icon3d): CoverSpec => ({ kind: "icon", icon });

export const sectionCover = (section: Section): CoverSpec => iconCover(SECTION_ICON[section]);

// 제품 사진 → 대표 성분 아이콘 → 분류 아이콘
export const beautyCover = (p: Pick<BeautyProduct, "category" | "icon" | "photo">): CoverSpec =>
  p.photo ? { kind: "product", photo: p.photo } : iconCover(p.icon ?? BEAUTY_CATEGORY_ICON[p.category]);

// 사진 → 명소 아이콘 → 종류 아이콘
export const placeCover = (p: Pick<Place, "kind" | "icon" | "photo">): CoverSpec =>
  p.photo ? { kind: "photo", photo: p.photo } : iconCover(p.icon ?? PLACE_KIND_ICON[p.kind]);

// 동네 타일: 사진(travel/items.ts AREA_PHOTOS) → 동네 아이콘
export const areaCover = (area: AreaSlug, photo?: CoverPhoto): CoverSpec =>
  photo ? { kind: "photo", photo } : iconCover(AREA_ICON[area]);

export const clinicCover = (p: Pick<Procedure, "icon">): CoverSpec => iconCover(p.icon);

export const dramaCover = (d: Pick<Drama, "icon">): CoverSpec => iconCover(d.icon);
