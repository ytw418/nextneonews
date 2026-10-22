import { useSyncExternalStore } from "react";

import { storageGet, storageSet } from "./storage";

// 내 최애 (홈 '내 최애' 줄). 로그인 없이 이 기기 localStorage 에만 두고 서버로 보내지 않는다. 클라이언트 전용(훅이 있다).
// 차트에서 빠져도 줄에 남도록 이름·사진·주소를 같이 적어 둔다 (그날 차트 후보에 있으면 최신 글·D-day 를 붙여 보인다)

export interface PickItem {
  id: string; // Entity.id (위키데이터 Q-id)
  name: string; // 고른 때 화면 언어 이름
  slug: string | null; // 인물 페이지 /idol/{slug}
  avatar: string | null; // 120px 사진
  tint: string; // 사진이 없을 때 이니셜 바탕
  at: number; // 고른 시각 (ms)
}

const KEY = "hb:picks";
export const PICKS_MAX = 3;
const CHANGED = "hb:picks-changed";

function isItem(v: unknown): v is PickItem {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    r.id.length > 0 &&
    typeof r.name === "string" &&
    (r.slug === null || typeof r.slug === "string") &&
    (r.avatar === null || typeof r.avatar === "string") &&
    typeof r.tint === "string" &&
    typeof r.at === "number"
  );
}

// 저장된 문자열 → 목록. 손상된 값은 버리고, 같은 사람은 하나만, 상한까지 (고른 순서 그대로)
export function parsePicks(raw: string | null): PickItem[] {
  if (!raw) return [];
  try {
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    const seen = new Set<string>();
    return list
      .filter(isItem)
      .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
      .slice(0, PICKS_MAX);
  } catch {
    return [];
  }
}

// 이미 있으면 빼고, 없으면 맨 뒤에 넣는다. 꽉 찼으면 그대로 (가장 먼저 고른 사람을 몰래 빼지 않는다)
export function withToggled(list: readonly PickItem[], item: Omit<PickItem, "at">, at: number): PickItem[] {
  if (list.some((p) => p.id === item.id)) return list.filter((p) => p.id !== item.id);
  if (list.length >= PICKS_MAX) return [...list];
  return [...list, { ...item, at }];
}

export function savePicks(list: readonly PickItem[]) {
  storageSet(KEY, JSON.stringify(list.slice(0, PICKS_MAX)));
  window.dispatchEvent(new Event(CHANGED));
}

export function togglePick(item: Omit<PickItem, "at">): PickItem[] {
  const next = withToggled(parsePicks(storageGet(KEY)), item, Date.now());
  savePicks(next);
  return next;
}

// 같은 원문이면 같은 참조 (useSyncExternalStore 가 다시 그리지 않게)
let cacheRaw: string | null | undefined;
let cache: PickItem[] = [];
function snapshot(): PickItem[] {
  const raw = storageGet(KEY);
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = parsePicks(raw);
  }
  return cache;
}
const EMPTY: PickItem[] = [];

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// 서버·하이드레이션 때는 빈 목록 (기기마다 달라서 서버 HTML 에 넣지 않는다)
export function usePicks(): PickItem[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

// 하이드레이션이 끝났는지 (첫 그림에서 '최애 고르기' 카드가 번쩍였다 사라지지 않게)
const noSubscribe = () => () => {};
export function useHydrated(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}
