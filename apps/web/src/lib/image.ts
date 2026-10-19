// next/image 커스텀 로더 (next.config.ts images.loaderFile). 위키미디어 공용 사진은 원본(최대 수 MB) 대신
// 위키미디어가 미리 만들어 두는 표준 폭 썸네일을 받는다. 그 밖의 주소는 그대로 쓴다.
// 서버 컴포넌트에서도 imgSrc 를 부르므로 'use client' 를 달지 않는다 (의존성 없는 순수 함수만 둔다)

// 위키미디어 표준 썸네일 폭. 400·640 같은 비표준 폭은 400 오류가 난다 (mediawiki.org/wiki/Common_thumbnail_sizes)
const STANDARD_WIDTHS = [120, 250, 330, 500, 960, 1280, 1920];
// 원본 폭을 모를 때의 상한 (작은 원본을 크게 늘려 받지 않게)
const UNKNOWN_MAX = 960;
// 원본보다 작은 썸네일이 원본 폭의 이 비율 이상이면 원본 대신 받는다: 586px 원본 PNG(2.5MB) 대신 500px 썸네일(0.4MB).
// 326px 원본을 250px 로 줄이면(0.77) 화면 폭 히어로에서 흐려져 원본을 쓴다
const MIN_THUMB_RATIO = 0.8;

// 아이폰 3배 화면이 사진을 2배 남짓으로만 받게 하는 srcset 후보 (next.config.ts images.deviceSizes 에 함께 넣는다).
// 브라우저는 '칸 폭 × 화면 배율' 이상인 첫 후보를 고른다: 반 폭 카드(390×0.45×3 = 527px)는 640w 를, 화면 폭 히어로
// (390×3 = 1170px)는 1200w 를 고르는데, 로더가 이 두 후보를 그 아래 표준 폭(500·960)으로 내려 준다.
// 2배 화면은 원래대로 500w·960w 를 고른다. next/image 도 width 고정 사진은 2배까지만 받는다 (get-img-props getWidths)
export const DPR_CAP_WIDTHS = [640, 1200];

// upload.wikimedia.org/wikipedia/commons/a/ab/파일 또는 .../commons/thumb/a/ab/파일/1280px-파일 (thumb. 호스트도 같은 경로)
const COMMONS = /^https:\/\/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+)/;
const HINT = /#ow=(\d+)$/;

// 3배 화면용 후보는 그보다 작은 가장 큰 표준 폭으로 내린다. 그 밖의 폭은 그 이상인 첫 표준 폭을 고른다(thumbWidth)
function targetWidth(requested: number): number {
  if (!DPR_CAP_WIDTHS.includes(requested)) return requested;
  return STANDARD_WIDTHS.filter((w) => w <= requested).at(-1) ?? requested;
}

// 받을 표준 폭. null 이면 원본을 쓴다.
// 원본 폭을 알면 원본보다 작은 표준 폭만 고르고(같거나 큰 썸네일은 오류), 요청이 그보다 크면 원본에 가까운
// 썸네일(MIN_THUMB_RATIO 이상)이나 원본을 쓴다. 모르면 960 안에서 고른다 (큰 원본을 통째로 받지 않게)
export function thumbWidth(requested: number, originalWidth?: number): number | null {
  const target = targetWidth(requested);
  const known = !!originalWidth && originalWidth > 0;
  const fits = STANDARD_WIDTHS.filter((w) => (known ? w < originalWidth! : w <= UNKNOWN_MAX));
  const hit = fits.find((w) => w >= target);
  if (hit) return hit;
  const largest = fits.at(-1);
  if (largest === undefined) return null;
  if (!known) return largest;
  return largest / originalWidth! >= MIN_THUMB_RATIO ? largest : null;
}

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  const m = COMMONS.exec(src);
  if (!m) return src.replace(HINT, "");
  const [, a, ab, file] = m;
  const hint = HINT.exec(src);
  const w = thumbWidth(width, hint ? Number(hint[1]) : undefined);
  if (w === null) return `https://upload.wikimedia.org/wikipedia/commons/${a}/${ab}/${file}`;
  // SVG 는 PNG 로 그린 썸네일만 있다
  const thumb = /\.svg$/i.test(file) ? `${w}px-${file}.png` : `${w}px-${file}`;
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${a}/${ab}/${file}/${thumb}`;
}

// <Image src> 에 원본 폭 힌트(#ow=)를 붙인다. 로더가 이 폭을 넘는 썸네일을 고르지 않는다 (Media.width)
export function imgSrc(url: string, originalWidth?: number | null): string {
  const base = url.replace(HINT, "");
  return originalWidth && originalWidth > 0 ? `${base}#ow=${originalWidth}` : base;
}
