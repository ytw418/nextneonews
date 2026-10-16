import { createHash } from "node:crypto";

// 인물·작품 대표 사진 (Entity.image = 위키미디어 공용 파일 이름, P18).
// 공용 썸네일 주소는 파일 이름(공백→_)의 md5 앞 1·2글자로 폴더가 정해져 API 없이 만들 수 있다:
// https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/<파일>/500px-<파일>

const COMMONS = "https://upload.wikimedia.org/wikipedia/commons";

// 공용 서버가 미리 만들어 두는 단계 폭(60·120·250·500…)만 쓴다. 히어로(4:5)는 500, 원형 사진은 60·120·250
export const PHOTO_WIDTH = 500;

export interface ImageMeta {
  author?: string | null;
  licenseName?: string | null;
  licenseUrl?: string | null;
  sourceUrl?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface EntityPhoto {
  src: string; // 500px (히어로)
  card: string; // 250px (64px 원·카드)
  avatar: string; // 120px (40~48px 원)
  mini: string; // 60px (표 안 32px 원 — 첫 화면 밖 사진이 히어로 사진과 대역폭을 다투지 않게 작게)
  author: string | null;
  licenseName: string;
  licenseUrl: string | null;
  sourceUrl: string;
}

export function commonsThumb(file: string, width = PHOTO_WIDTH, originalWidth?: number | null): string {
  const name = file.replace(/^File:/i, "").replace(/ /g, "_");
  const hash = createHash("md5").update(name).digest("hex");
  const path = `${hash[0]}/${hash.slice(0, 2)}/${encodeURIComponent(name)}`;
  // 원본보다 큰 썸네일은 만들어 주지 않아서(오류) 원본을 그대로 쓴다
  if (originalWidth && originalWidth <= width) return `${COMMONS}/${path}`;
  // SVG 썸네일은 PNG 로 나온다
  const thumb = /\.svg$/i.test(name) ? `${name}.png` : name;
  return `${COMMONS}/thumb/${path}/${width}px-${encodeURIComponent(thumb)}`;
}

function asMeta(value: unknown): ImageMeta | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ImageMeta) : null;
}

// CC 표시(저작자·라이선스·원본 링크)를 할 수 있는 사진만 돌려준다.
// imageMeta 는 worker entity-meta 가 Commons API 로 채운다 — 아직 없으면 사진 대신 이니셜을 보인다
export function entityPhoto(entity: { image: string | null; imageMeta: unknown }): EntityPhoto | null {
  const meta = asMeta(entity.imageMeta);
  if (!entity.image || !meta?.licenseName) return null;
  const file = entity.image.replace(/^File:/i, "");
  return {
    src: commonsThumb(file, PHOTO_WIDTH, meta.width),
    card: commonsThumb(file, 250, meta.width),
    avatar: commonsThumb(file, 120, meta.width),
    mini: commonsThumb(file, 60, meta.width),
    author: meta.author?.trim() || null,
    licenseName: meta.licenseName,
    licenseUrl: meta.licenseUrl || null,
    sourceUrl: meta.sourceUrl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`,
  };
}
