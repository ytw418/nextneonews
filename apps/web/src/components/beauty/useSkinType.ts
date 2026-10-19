"use client";

import { useSyncExternalStore } from "react";

import type { SkinType } from "@/data/beauty/types";
import { isSkinType, SKIN_TYPE_CHANGED, SKIN_TYPE_KEY } from "@/lib/beauty";
import { storageGet, storageSet } from "@/lib/storage";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SKIN_TYPE_CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SKIN_TYPE_CHANGED, onChange);
  };
}

function read(): SkinType | null {
  const value = storageGet(SKIN_TYPE_KEY);
  return isSkinType(value) ? value : null;
}

// 이 기기의 피부 타입 (테스트를 끝낸 적이 없으면 null). 서버 렌더·첫 하이드레이션에서는 null
export function useSkinType(): SkinType | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function saveSkinType(skin: SkinType): void {
  storageSet(SKIN_TYPE_KEY, skin);
  window.dispatchEvent(new Event(SKIN_TYPE_CHANGED));
}
