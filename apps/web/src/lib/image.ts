// next/image 커스텀 로더 (next.config.ts images.loaderFile). 위키미디어 공용 사진은 원본(최대 수 MB) 대신
// 위키미디어가 미리 만들어 두는 표준 폭 썸네일을 받는다. 그 밖의 주소는 그대로 쓴다.
// 서버 컴포넌트에서도 imgSrc 를 부르므로 'use client' 를 달지 않는다 (의존성 없는 순수 함수만 둔다)

// 위키미디어 표준 썸네일 폭. 400·640 같은 비표준 폭은 400 오류가 난다 (mediawiki.org/wiki/Common_thumbnail_sizes)
const STANDARD_WIDTHS = [120, 250, 330, 500, 960, 1280, 1920];
// 원본 폭을 모를 때의 상한 (작은 원본을 크게 늘려 받지 않게)
const UNKNOWN_MAX = 960;

// upload.wikimedia.org/wikipedia/commons/a/ab/파일 또는 .../commons/thumb/a/ab/파일/1280px-파일 (thumb. 호스트도 같은 경로)
const COMMONS = /^https:\/\/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+)/;
const HINT = /#ow=(\d+)$/;

// 요청 폭 이상인 첫 표준 폭. 원본 폭(없으면 960)을 넘으면 그 안의 가장 큰 표준 폭. 원본이 120 보다 작으면 null (원본을 쓴다)
export function thumbWidth(requested: number, originalWidth?: number): number | null {
  const max = originalWidth && originalWidth > 0 ? originalWidth : UNKNOWN_MAX;
  const fits = STANDARD_WIDTHS.filter((w) => w <= max);
  if (fits.length === 0) return null;
  return fits.find((w) => w >= requested) ?? fits[fits.length - 1];
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
