import type { Icon3d } from "../icons3d";
import type { Region } from "../types";

export type WatchPlatform = "netflix" | "viki" | "disney" | "prime" | "viu" | "iqiyi" | "wavve" | "tving";

export interface Drama {
  slug: string;
  year: number;
  episodes: number;
  network: string;
  genres: string[]; // DramaTextFile.genres 의 키 (영문 소문자)
  wikidataId?: string; // Q-id → Entity 가 있으면 /idol 연결·sameAs
  watch: { platform: WatchPlatform; url?: string; regions?: Region[] }[];
  cast: { name: string; entityId?: string; role?: string }[]; // name 영문
  filmingPlaces: string[]; // place slug
  similar: string[]; // drama slug
  editorialScore: number;
  icon: Icon3d; // 작품 상징 3D 아이콘 (포스터는 저작물이라 쓰지 않는다)
  addedAt: string;
  sources: string[];
}

export interface DramaText {
  title: string;
  tagline: string;
  synopsis: string;
  whyWatch: string[]; // 3개
}
export type DramaText9 = Record<string, DramaText>;

// text/{locale}.json 한 파일의 모양
export interface DramaTextFile {
  // Drama.genres 에 쓰는 영문 소문자 키(romance, fantasy, thriller, comedy, melodrama, legal, medical, historical, youth, family, action, mystery) → 번역
  genres: Record<string, string>;
  dramas: Record<string, DramaText>; // slug → 문구
}
