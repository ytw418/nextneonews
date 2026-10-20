import type { CategoryKey } from "@kmedia/core";

import type { Section } from "./types";

// 3D 아이콘 (Microsoft Fluent Emoji 3D, MIT — public/icons3d/LICENSE). 강남언니·여신티켓처럼 면은 회색, 색은 아이콘이 낸다.
// 키 = public/icons3d/<키>.webp 파일 이름, 값 = Fluent 레포의 폴더 이름 (scripts/icons3d-fetch.mjs 가 이 표로 PNG 원본을 받는다).
// 아이콘을 더하면: 여기 한 줄 → node apps/web/scripts/icons3d-fetch.mjs (받기 + WebP 변환). 파일이 빠지면 check-catalog 가 잡는다.
// 사진을 쓸 수 없는 가이드 항목(제품·시술·드라마)의 커버도 이 아이콘으로 그린다 (data/cover.ts)
export const ICON3D = {
  // 홈 카테고리·섹션 (160px 원본)
  kpop: "Microphone",
  kent: "Glowing star",
  kdrama: "Clapper board",
  kfood: "Steaming bowl",
  kbeauty: "Lipstick",
  travel: "Airplane",
  study: "Books",
  love: "Sparkling heart",
  "working-holiday": "Luggage",
  jobs: "Briefcase",
  housing: "House with garden",
  life: "Shopping bags",
  "g-beauty": "Lotion bottle",
  "g-travel": "World map",
  "g-clinic": "Sparkles",
  "g-drama": "Popcorn",
  // 뷰티: 분류·대표 성분 (256px 원본)
  bubbles: "Bubbles",
  droplet: "Droplet",
  "test-tube": "Test tube",
  jar: "Jar",
  sun: "Sun",
  cucumber: "Cucumber",
  mirror: "Mirror",
  palette: "Artist palette",
  "hair-pick": "Hair pick",
  snail: "Snail",
  "rice-ball": "Rice ball",
  honey: "Honey pot",
  herb: "Herb",
  leaf: "Leaf fluttering in wind",
  island: "Desert island",
  ginseng: "Ginger root",
  gem: "Gem stone",
  beans: "Beans",
  cherries: "Cherries",
  tree: "Deciduous tree",
  mushroom: "Mushroom",
  tea: "Teacup without handle",
  dna: "Dna",
  moon: "Crescent moon",
  // 피부 타입 진단
  cactus: "Cactus",
  sweat: "Sweat droplets",
  "yin-yang": "Yin yang",
  blossom: "Cherry blossom",
  magnifier: "Magnifying glass tilted left",
  // 클리닉 시술
  syringe: "Syringe",
  tooth: "Tooth",
  toothbrush: "Toothbrush",
  bolt: "Nut and bolt",
  eyes: "Eyes",
  nose: "Nose",
  thread: "Thread",
  massage: "Person getting massage",
  voltage: "High voltage",
  fire: "Fire",
  // 드라마 작품 상징
  crown: "Crown",
  umbrella: "Umbrella",
  tangerine: "Tangerine",
  hotel: "Hotel",
  devil: "Smiling face with horns",
  ring: "Ring",
  stethoscope: "Stethoscope",
  telephone: "Telephone receiver",
  cooking: "Cooking",
  hospital: "Hospital",
  speech: "Speech balloon",
  parachute: "Parachute",
  candle: "Candle",
  beer: "Beer mug",
  whale: "Spouting whale",
  fencing: "Person fencing",
  "movie-camera": "Movie camera",
  videocassette: "Videocassette",
  laptop: "Laptop",
  // 여행 동네·명소 종류 (사진이 없을 때)
  coffee: "Hot beverage",
  guitar: "Guitar",
  globe: "Globe showing asia-australia",
  lantern: "Red paper lantern",
  beach: "Beach with umbrella",
  camera: "Camera with flash",
  bagel: "Bagel",
  balloon: "Balloon",
  television: "Television",
  sunglasses: "Sunglasses",
  cloud: "Cloud",
} as const satisfies Record<string, string>;

export type Icon3d = keyof typeof ICON3D;

export const icon3dSrc = (icon: Icon3d): string => `/icons3d/${icon}.webp`;

export const CATEGORY_ICON: Record<CategoryKey, Icon3d> = {
  KPOP: "kpop",
  KENT: "kent",
  KDRAMA: "kdrama",
  KFOOD: "kfood",
  KBEAUTY: "kbeauty",
  TRAVEL: "travel",
  STUDY: "study",
  LOVE: "love",
  WORKING_HOLIDAY: "working-holiday",
  JOBS: "jobs",
  HOUSING: "housing",
  LIFE: "life",
};

export const SECTION_ICON: Record<Section, Icon3d> = {
  beauty: "g-beauty",
  travel: "g-travel",
  clinic: "g-clinic",
  drama: "g-drama",
};

// 홈 아이콘 메뉴·메모 카드·가이드 소개가 쓰는 이미지 주소
const srcMap = <K extends string>(icons: Record<K, Icon3d>) =>
  Object.fromEntries(Object.entries<Icon3d>(icons).map(([k, icon]) => [k, icon3dSrc(icon)])) as Record<K, string>;

export const CATEGORY_ICON3D = srcMap(CATEGORY_ICON);
export const SECTION_ICON3D = srcMap(SECTION_ICON);
