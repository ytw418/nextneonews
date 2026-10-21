import type { Tab } from "../lib/links";

// 지금 떠 있는 웹뷰들. 한 웹뷰에서 저장·해제하면 나머지 웹뷰에도 목록을 다시 심고(store/saved.ts),
// 웹 안에서 다른 탭 첫 화면 링크를 누르면 그 탭 웹뷰를 첫 화면으로 돌린다
export interface WebViewHandle {
  tab: Tab | null; // 저장함에서 연 상세 웹뷰는 null
  pushSaved(json: string): void;
  goRoot(): void;
}

const views = new Map<string, WebViewHandle>();

export function registerWebView(id: string, handle: WebViewHandle): () => void {
  views.set(id, handle);
  return () => {
    if (views.get(id) === handle) views.delete(id);
  };
}

export function broadcastSaved(json: string, exceptId: string | null): void {
  for (const [id, view] of views) if (id !== exceptId) view.pushSaved(json);
}

export function goTabRoot(tab: Tab): void {
  for (const view of views.values()) if (view.tab === tab) view.goRoot();
}
