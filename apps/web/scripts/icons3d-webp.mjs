#!/usr/bin/env node
// 3D 아이콘 원본(public/icons3d/*.png, 160px)을 같은 이름의 WebP 로 만든다. 화면은 WebP 만 받는다 (src/data/icons3d.ts).
// PNG 16개 328KB → WebP 41KB. 홈 첫 화면에 아이콘이 15개라 LCP 사진과 대역을 나눠 쓰던 몫이 준다 (docs/predeploy/perf.md §8)
// 아이콘을 더하거나 바꾸면 PNG 를 넣고 다시 돌린다: node apps/web/scripts/icons3d-webp.mjs
// sharp 는 next 가 함께 설치한다 (루트 node_modules)
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const dir = fileURLToPath(new URL("../public/icons3d", import.meta.url));
// q80 은 원본과 나란히 놓아도 구분되지 않는다 (2026-10-20 비교). 투명 가장자리는 조금 더 곱게
const OPTIONS = { quality: 80, alphaQuality: 90, effort: 6 };

let total = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".png"))) {
  const src = join(dir, file);
  const { size } = await sharp(src).webp(OPTIONS).toFile(src.replace(/\.png$/, ".webp"));
  total += size;
}
console.log(`icons3d: WebP 합계 ${(total / 1024).toFixed(1)}KB`);
