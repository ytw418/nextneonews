// 스크립트가 만든다 — 손으로 고치지 않는다: node apps/web/scripts/product-photo.mjs
// 제품 slug → 오려 낸 제품 CC 사진 (public/products/<slug>.webp). 고른 원본 목록은 scripts/product-photos.json
import type { ProductPhoto } from "../types";

export const BEAUTY_PHOTOS: Partial<Record<string, ProductPhoto>> = {
  "beauty-of-joseon-revive-eye-serum-ginseng-retinal": {
    src: "/products/beauty-of-joseon-revive-eye-serum-ginseng-retinal.webp",
    width: 143,
    height: 640,
    author: "foodless",
    licenseName: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://world.openbeautyfacts.org/product/8809738316146",
    sourceName: "Open Beauty Facts",
  },
  "cosrx-low-ph-good-morning-gel-cleanser": {
    src: "/products/cosrx-low-ph-good-morning-gel-cleanser.webp",
    width: 336,
    height: 640,
    author: "Open Beauty Facts contributors",
    licenseName: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://world.openbeautyfacts.org/product/8809416470511",
    sourceName: "Open Beauty Facts",
  },
  "laneige-lip-sleeping-mask": {
    src: "/products/laneige-lip-sleeping-mask.webp",
    width: 532,
    height: 640,
    author: "Open Beauty Facts contributors",
    licenseName: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://world.openbeautyfacts.org/product/8809643053273",
    sourceName: "Open Beauty Facts",
  },
  "tirtir-mask-fit-red-cushion": {
    src: "/products/tirtir-mask-fit-red-cushion.webp",
    width: 640,
    height: 401,
    author: "Open Beauty Facts contributors",
    licenseName: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://world.openbeautyfacts.org/product/8809928135892",
    sourceName: "Open Beauty Facts",
  },
  "torriden-dive-in-serum": {
    src: "/products/torriden-dive-in-serum.webp",
    width: 260,
    height: 640,
    author: "smoothie-app",
    licenseName: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://world.openbeautyfacts.org/product/8809504741653",
    sourceName: "Open Beauty Facts",
  },
};
