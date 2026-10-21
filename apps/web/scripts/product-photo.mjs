#!/usr/bin/env node
// 뷰티 제품 커버 사진을 만든다: Open Beauty Facts(OBF) 원본 업로드(CC BY-SA 3.0) → 제품만 오려 내기(macOS Vision, scripts/cutout.swift)
// → 긴 변 640px 투명 WebP(public/products/<slug>.webp) → 메타(src/data/beauty/photos.ts).
// 고른 원본은 scripts/product-photos.json:
//   OBF 사진   { slug, code: 바코드, rawId: 원본 업로드 번호, rotate?: 90|180|270 } — CC BY-SA, 상세에 저작자 표기
//   직접 찍은 사진 { slug, file: "/절대/경로.jpg", rotate? } — 운영자가 찍은 사진(단색 바닥·앞면 전체·손 없이), 표기 없음
// OBF 는 올린이가 직접 찍은 사진만 고른다 — 같은 사람이 여러 브랜드에 600x600 상품컷을 올린 것처럼 쇼핑몰 사진을 퍼 온 업로드는 라이선스가 무효다.
// 사용(맥에서만): node apps/web/scripts/product-photo.mjs [slug …]   (slug 를 주면 그 제품만 다시 만든다)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const UA = "UnnieNoteBot/1.0 (https://unnienote.app)";
const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "scripts", "product-photos.json"), "utf8"));
const only = new Set(process.argv.slice(2));
const outDir = join(root, "public", "products");
const dataFile = join(root, "src", "data", "beauty", "photos.ts");
mkdirSync(outDir, { recursive: true });

// 받은 원본은 매번 새 빈 폴더에 둔다 (내려받은 파일 옆에서 아무것도 실행하지 않는다)
const work = mkdtempSync(join(tmpdir(), "product-photo-"));
const cutout = join(work, "cutout");
execFileSync("swiftc", ["-O", "-o", cutout, join(root, "scripts", "cutout.swift")], { stdio: "inherit" });

// 13자리 바코드는 3/3/3/나머지 폴더로 나뉜다 (OBF 이미지 주소 규칙)
const codePath = (code) => (code.length > 8 ? code.replace(/^(\d{3})(\d{3})(\d{3})(\d+)$/, "$1/$2/$3/$4") : code);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const previous = await import(`${dataFile}?t=${Date.now()}`).then((m) => m.BEAUTY_PHOTOS).catch(() => ({}));
const photos = {};
for (const { slug, code, rawId, file: own, rotate } of manifest) {
  if (only.size && !only.has(slug)) {
    if (previous[slug]) photos[slug] = previous[slug];
    continue;
  }
  let raw = own;
  let image = null;
  if (!own) {
    const res = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${code}.json?fields=images`, {
      headers: { "User-Agent": UA },
    });
    image = (await res.json()).product?.images?.[rawId];
    if (!image) throw new Error(`${slug}: OBF ${code} 에 원본 ${rawId} 없음`);
    raw = join(work, `${slug}.jpg`);
    const img = await fetch(`https://images.openbeautyfacts.org/images/products/${codePath(code)}/${rawId}.jpg`, {
      headers: { "User-Agent": UA },
    });
    if (!img.ok) throw new Error(`${slug}: 원본 받기 실패 ${img.status}`);
    writeFileSync(raw, Buffer.from(await img.arrayBuffer()));
  }
  const cut = join(work, `${slug}.png`);
  execFileSync(cutout, [raw, cut], { stdio: "inherit" });
  const file = join(outDir, `${slug}.webp`);
  // 오려 낸 가장자리에 남은 투명 여백을 걷고, 긴 변 640px (히어로 오른쪽 칸 약 130px × 3배 화면 + 여유)
  const { width, height } = await sharp(cut)
    .rotate(rotate ?? 0)
    .trim({ threshold: 1 })
    .resize(640, 640, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(file);
  photos[slug] = image
    ? {
        src: `/products/${slug}.webp`,
        width,
        height,
        // 앱으로 이름 없이 올린 사진은 OBF 공용 계정 이름으로 올라온다
        author: image.uploader === "openfoodfacts-contributors" ? "Open Beauty Facts contributors" : image.uploader,
        licenseName: "CC BY-SA 3.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
        sourceUrl: `https://world.openbeautyfacts.org/product/${code}`,
        sourceName: "Open Beauty Facts",
      }
    : {
        src: `/products/${slug}.webp`,
        width,
        height,
        author: null,
        licenseName: null,
        licenseUrl: null,
        sourceUrl: null,
        sourceName: null,
      };
  console.log(`${slug}: ${width}x${height} (${image ? image.uploader : "직접 찍은 사진"})`);
  if (image) await sleep(700); // OBF 서버 예의: 천천히
}

// prettier 와 같은 모양 (slug 는 하이픈이 있어 따옴표, 필드 이름은 따옴표 없이)
const body = Object.entries(photos)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([slug, p]) => {
    const fields = Object.entries(p).map(([key, value]) => `    ${key}: ${JSON.stringify(value)},`);
    return `  ${JSON.stringify(slug)}: {\n${fields.join("\n")}\n  },`;
  })
  .join("\n");
writeFileSync(
  dataFile,
  `// 스크립트가 만든다 — 손으로 고치지 않는다: node apps/web/scripts/product-photo.mjs
// 제품 slug → 오려 낸 제품 CC 사진 (public/products/<slug>.webp). 고른 원본 목록은 scripts/product-photos.json
import type { ProductPhoto } from "../types";

export const BEAUTY_PHOTOS: Partial<Record<string, ProductPhoto>> = {${body ? `\n${body}\n` : ""}};
`,
);
console.log(`product-photo: ${Object.keys(photos).length}개 → src/data/beauty/photos.ts`);
