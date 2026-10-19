import { useSyncExternalStore } from "react";

import { CATALOG_SLUG, isSavedId, isSavedKind } from "../data/sections";
import type { SavedKind } from "../data/types";
import { storageGet, storageSet } from "./storage";

export type { SavedKind } from "../data/types";

// 로그인 없는 저장(하트)·명소 '가 봤어요' 도장. 이 기기 localStorage 에만 두고 서버로 보내지 않는다.
// 클라이언트 전용(훅이 있다): 서버 코드는 여기서 타입만 가져간다 (import type).
// 저장소를 못 쓰는 브라우저(사파리 사생활 보호·일부 인앱)는 이번 방문 동안 메모리에 둔다.
// 종류·ID 규칙은 data/sections.ts 하나 (서버 /api/saved 와 같은 규칙으로 걸러야 한 항목 때문에 목록 전체가 깨지지 않는다)

export interface SavedItem {
  kind: SavedKind;
  id: string; // 글은 Translation.slug, 나머지는 카탈로그 slug
  at: number; // 저장한 시각 (ms)
}

export const SAVED_KEY = "hb:saved";
export const SAVED_MAX = 300; // 넘으면 가장 오래된 것부터 뺀다
export const SAVED_CHANGED = "hb:saved-changed"; // 같은 탭의 다른 하트·저장함이 함께 바뀌게 (storage 이벤트는 같은 탭에 오지 않는다)
export const SAVED_SHARE_MAX = 100; // 공유 링크 하나에 담는 수 (주소 길이)

export const VISITED_KEY = "hb:visited";
const VISITED_CHANGED = "hb:visited-changed";
const VISITED_MAX = 300;

const keyOf = (item: Pick<SavedItem, "kind" | "id">) => `${item.kind}:${item.id}`;

function isItem(value: unknown): value is SavedItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return isSavedKind(v.kind) && isSavedId(v.kind, v.id) && typeof v.at === "number" && Number.isFinite(v.at);
}

// 최신순 정렬 + 같은 항목은 최신 하나만 + 상한
function normalize(items: readonly SavedItem[]): SavedItem[] {
  const seen = new Set<string>();
  return [...items]
    .sort((a, b) => b.at - a.at)
    .filter((item) => {
      const key = keyOf(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, SAVED_MAX);
}

// 저장된 문자열 → 목록. 손상된 값·모르는 종류는 버린다
export function parseSaved(raw: string | null): SavedItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? normalize(parsed.filter(isItem)) : [];
  } catch {
    return [];
  }
}

// 있으면 빼고 없으면 맨 앞에 넣는다
export function withToggled(list: readonly SavedItem[], kind: SavedKind, id: string, now: number) {
  const exists = list.some((i) => i.kind === kind && i.id === id);
  return exists
    ? { list: list.filter((i) => !(i.kind === kind && i.id === id)), saved: false }
    : { list: normalize([{ kind, id, at: now }, ...list]), saved: true };
}

// 공유 링크 가져오기·되돌리기. 이미 있는 항목은 건너뛰고 at 은 받은 그대로 둔다
export function withAdded(list: readonly SavedItem[], items: readonly SavedItem[]) {
  const have = new Set(list.map(keyOf));
  const fresh = normalize(items.filter((i) => isItem(i) && !have.has(keyOf(i))));
  return { list: normalize([...list, ...fresh]), added: fresh.length };
}

// "kind:id,kind:id" → base64url (최신 SAVED_SHARE_MAX 개). id 는 ASCII 만이라 btoa 로 충분하다
export function encodeSavedShare(items: readonly SavedItem[]): string {
  const text = items.slice(0, SAVED_SHARE_MAX).map(keyOf).join(",");
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// 공유 링크(?i=)의 값 → 목록. 주소는 아무나 만들 수 있으니 형식이 맞는 것만, 최대 SAVED_SHARE_MAX 개.
// 순서를 지키려고 앞 항목일수록 최근 시각을 준다
export function decodeSavedShare(code: string, now = Date.now()): SavedItem[] {
  let text: string;
  try {
    text = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return [];
  }
  const items = text
    .split(",")
    .slice(0, SAVED_SHARE_MAX)
    .map((pair, i) => {
      const [kind, id] = pair.split(":");
      return { kind, id, at: now - i };
    })
    .filter(isItem);
  return normalize(items);
}

// ───────── 저장소 (useSyncExternalStore) ─────────
function createStore<T>(key: string, event: string, parse: (raw: string | null) => T, empty: T) {
  let memory: string | null = null;
  let lastRaw: string | null | undefined;
  let last = empty;
  return {
    // 같은 문자열이면 같은 배열을 돌려준다 (useSyncExternalStore 가 매번 새 값으로 보지 않게)
    read(): T {
      const raw = storageGet(key) ?? memory;
      if (raw !== lastRaw) {
        lastRaw = raw;
        last = parse(raw);
      }
      return last;
    },
    write(value: T) {
      const raw = JSON.stringify(value);
      memory = raw;
      storageSet(key, raw);
      window.dispatchEvent(new Event(event));
    },
    subscribe(onChange: () => void) {
      window.addEventListener("storage", onChange);
      window.addEventListener(event, onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(event, onChange);
      };
    },
  };
}

const NO_ITEMS: SavedItem[] = [];
const saved = createStore(SAVED_KEY, SAVED_CHANGED, parseSaved, NO_ITEMS);

// 최신순
export function readSaved(): SavedItem[] {
  return saved.read();
}

export function isSaved(kind: SavedKind, id: string): boolean {
  return saved.read().some((i) => i.kind === kind && i.id === id);
}

// 저장됐으면 true
export function toggleSaved(kind: SavedKind, id: string): boolean {
  if (!isSavedKind(kind) || !isSavedId(kind, id)) return false;
  const next = withToggled(saved.read(), kind, id, Date.now());
  saved.write(next.list);
  return next.saved;
}

export function removeSaved(kind: SavedKind, id: string): void {
  const list = saved.read();
  const next = list.filter((i) => !(i.kind === kind && i.id === id));
  if (next.length !== list.length) saved.write(next);
}

// 공유 링크 가져오기 (중복 제외). 더한 수를 돌려준다
export function addSavedMany(items: SavedItem[]): number {
  const next = withAdded(saved.read(), items);
  if (next.added > 0) saved.write(next.list);
  return next.added;
}

// 서버 렌더와 첫 하이드레이션에서는 빈 목록 (저장 여부는 이 기기만 안다)
export function useSaved(): SavedItem[] {
  return useSyncExternalStore(saved.subscribe, saved.read, () => NO_ITEMS);
}

export function useIsSaved(kind: SavedKind, id: string): boolean {
  return useSyncExternalStore(
    saved.subscribe,
    () => isSaved(kind, id),
    () => false,
  );
}

// ───────── 명소 '가 봤어요' 도장 (place slug, 최신순) ─────────
function parseVisited(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const slugs = parsed.filter((s): s is string => typeof s === "string" && CATALOG_SLUG.test(s));
    return [...new Set(slugs)].slice(0, VISITED_MAX);
  } catch {
    return [];
  }
}

const NO_SLUGS: string[] = [];
const visited = createStore(VISITED_KEY, VISITED_CHANGED, parseVisited, NO_SLUGS);

export function useVisited(): string[] {
  return useSyncExternalStore(visited.subscribe, visited.read, () => NO_SLUGS);
}

export function useIsVisited(slug: string): boolean {
  return useSyncExternalStore(
    visited.subscribe,
    () => isVisited(slug),
    () => false,
  );
}

export function isVisited(slug: string): boolean {
  return visited.read().includes(slug);
}

// 도장을 찍었으면 true
export function toggleVisited(slug: string): boolean {
  if (!CATALOG_SLUG.test(slug)) return false;
  const list = visited.read();
  const on = !list.includes(slug);
  visited.write(on ? [slug, ...list].slice(0, VISITED_MAX) : list.filter((s) => s !== slug));
  return on;
}
