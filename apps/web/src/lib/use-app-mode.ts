"use client";

import { useSyncExternalStore } from "react";

import { isApp } from "./app-mode";

const noSubscribe = () => () => {};

// 언니노트 앱 웹뷰 안인지 (lib/app-mode.ts). 서버 렌더·첫 하이드레이션은 false — 깜빡임은 html[data-app] .app-hide CSS 가 막는다
export function useAppMode(): boolean {
  return useSyncExternalStore(noSubscribe, isApp, () => false);
}
