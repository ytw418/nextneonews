import { router } from "expo-router";

import type { Tab } from "./lib/links";
import { goTabRoot } from "./store/webviews";

const TAB_ROUTE = { home: "/", rankings: "/rankings", guide: "/guide", schedule: "/schedule", saved: "/saved" } as const;

// 네이티브 탭으로 옮기고 그 탭 웹뷰를 첫 화면으로 (웹 안의 탭 첫 화면 링크·저장 토스트 '보기')
export function openTab(tab: Tab): void {
  router.navigate(TAB_ROUTE[tab]);
  goTabRoot(tab);
}
