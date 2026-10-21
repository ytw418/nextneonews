import type { SavedItem } from "./saved-rules";

// 저장 목록 한 줄의 제목·주소·커버 (GET /api/saved, apps/web/src/app/api/saved/route.ts).
// 앱은 그리는 데 필요한 것만 확인한다. 순수 부분만 여기 — 요청은 화면이 한다
export interface Summary {
  kind: string;
  id: string;
  title: string;
  href: string; // 언어 접두사 없는 사이트 경로 ("/beauty/p/x")
  sub?: string;
  cover: { kind: "icon"; icon: string } | { kind: "photo"; photo: { url: string } };
}

export const SUMMARY_CHUNK = 100; // /api/saved 가 한 번에 받는 수

export function isSummary(value: unknown): value is Summary {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.kind !== "string" || typeof v.id !== "string" || typeof v.title !== "string") return false;
  if (typeof v.href !== "string" || !v.href.startsWith("/") || v.href.startsWith("//")) return false;
  if (v.sub !== undefined && typeof v.sub !== "string") return false;
  const c = v.cover as Record<string, unknown> | undefined;
  if (!c || typeof c !== "object") return false;
  if (c.kind === "icon") return typeof c.icon === "string" && /^[a-z0-9-]+$/.test(c.icon);
  const photo = c.photo as Record<string, unknown> | undefined;
  return c.kind === "photo" && !!photo && typeof photo.url === "string" && photo.url.startsWith("https://upload.wikimedia.org/");
}

export function summariesUrl(site: string, items: readonly SavedItem[], locale: string): string {
  return `${site}/api/saved?items=${encodeURIComponent(items.map((i) => `${i.kind}:${i.id}`).join(","))}&locale=${encodeURIComponent(locale)}`;
}

// 커버 그림 주소: 3D 아이콘은 사이트의 webp, 사진은 위키미디어 표준 썸네일 120px (apps/web/src/lib/image.ts 와 같은 규칙)
const COMMONS = /^https:\/\/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+)/;

export function coverUrl(site: string, cover: Summary["cover"]): string | null {
  if (cover.kind === "icon") return `${site}/icons3d/${cover.icon}.webp`;
  const m = COMMONS.exec(cover.photo.url);
  if (!m) return null;
  const [, a, ab, file] = m;
  const thumb = /\.svg$/i.test(file) ? `120px-${file}.png` : `120px-${file}`;
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${a}/${ab}/${file}/${thumb}`;
}
