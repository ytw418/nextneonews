import { useSyncExternalStore } from "react";

import { storageGet, storageSet } from "./storage";

// 최근 본 글 (홈 '続きから'). 이 기기 localStorage 에만 두고 서버로 보내지 않는다. 클라이언트 전용(훅이 있다).
// hb:read(slug 200개, 다음 글 건너뛰기용)와 따로 둔다: 홈 카드를 그리려면 제목·카테고리·사진이 필요하다

export interface RecentItem {
  slug: string;
  locale: string;
  title: string;
  category: string;
  imageUrl?: string;
  at: number; // 읽은 시각 (ms)
}

const KEY = "hb:recent";
export const RECENT_MAX = 20;
const CHANGED = "hb:recent-changed";

function isItem(v: unknown): v is RecentItem {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.slug === "string" &&
    typeof r.locale === "string" &&
    typeof r.title === "string" &&
    typeof r.category === "string" &&
    (r.imageUrl === undefined || typeof r.imageUrl === "string") &&
    typeof r.at === "number"
  );
}

function read(): RecentItem[] {
  try {
    const list: unknown = JSON.parse(storageGet(KEY) ?? "[]");
    return Array.isArray(list) ? list.filter(isItem) : [];
  } catch {
    return [];
  }
}

// 같은 글(같은 언어)은 맨 앞으로 옮긴다. 최신순, 상한을 넘으면 오래된 것부터 뺀다
export function withRecent(list: readonly RecentItem[], item: Omit<RecentItem, "at">, at: number): RecentItem[] {
  const rest = list.filter((r) => !(r.slug === item.slug && r.locale === item.locale));
  return [{ ...item, at }, ...rest].slice(0, RECENT_MAX);
}

export function rememberRecent(item: Omit<RecentItem, "at">) {
  storageSet(KEY, JSON.stringify(withRecent(read(), item, Date.now())));
  window.dispatchEvent(new Event(CHANGED));
}

// useSyncExternalStore 는 같은 값이면 같은 참조를 돌려줘야 다시 그리지 않는다: 원문 문자열이 같으면 이전 목록
let cacheRaw: string | null | undefined;
let cache: RecentItem[] = [];
function snapshot(): RecentItem[] {
  const raw = storageGet(KEY);
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = read();
  }
  return cache;
}
const EMPTY: RecentItem[] = [];

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// 서버·하이드레이션 때는 빈 목록 (기기마다 달라서 서버 HTML 에 넣지 않는다)
export function useRecent(): RecentItem[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}
