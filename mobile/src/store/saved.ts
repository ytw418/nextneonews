import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

import { normalizeSaved, parseSaved, type SavedItem } from "../lib/saved-rules";
import { broadcastSaved } from "./webviews";

// 저장 목록의 원본. 앱 저장소(AsyncStorage)에 있어 사파리처럼 7일 뒤 지워지지 않는다.
// 웹뷰 localStorage 'hb:saved' 는 미러다 — 페이지마다 앱이 심고, 웹에서 바뀌면 메시지로 받는다 (lib/bridge.ts).
// 규칙: 목록 전체를 바꾼다(마지막 쓰기 승). 합치지 않는다 — 합치면 해제한 것이 되살아난다

const KEY = "hb:saved";
const EMPTY: SavedItem[] = [];

let items: SavedItem[] = EMPTY;
let json = "[]";
const listeners = new Set<() => void>();

export async function loadSaved(): Promise<void> {
  try {
    items = parseSaved(await AsyncStorage.getItem(KEY));
    json = JSON.stringify(items);
  } catch {
    // 못 읽으면 빈 목록으로 시작한다 (다음 저장 때 다시 쓴다)
  }
}

export function savedJson(): string {
  return json;
}

// from: 이 변경을 보낸 웹뷰 id (그 웹뷰에는 다시 심지 않는다). 앱 화면에서 바꾸면 null
export function setSaved(list: readonly unknown[], from: string | null): void {
  const next = normalizeSaved(list);
  const nextJson = JSON.stringify(next);
  if (nextJson === json) return; // 같은 목록 — 메아리·중복을 여기서 끊는다
  items = next;
  json = nextJson;
  AsyncStorage.setItem(KEY, json).catch(() => {});
  for (const listener of listeners) listener();
  broadcastSaved(json, from);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSaved(): SavedItem[] {
  return useSyncExternalStore(subscribe, () => items);
}

export function useSavedJson(): string {
  return useSyncExternalStore(subscribe, () => json);
}
