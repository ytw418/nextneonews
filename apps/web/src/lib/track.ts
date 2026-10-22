import { appPlatform } from "@/lib/install";
import { capturePosthog } from "@/lib/posthog";

// 분석 이벤트. GA4(gtag 는 운영에서 GA ID 가 있을 때만, components/Analytics.tsx)와
// PostHog(운영에서만 init, instrumentation-client.ts)에 같은 이름으로 보낸다. 둘 다 없으면 아무것도 하지 않는다.
// 이벤트마다 platform(pwa·web)을 붙인다 — PostHog 는 쿠키 없는 모드라 한 번 정한 속성(super property)이 남지 않는다
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type TrackEvent =
  | "next_article_view"
  | "poll_vote"
  | "reaction"
  | "share"
  | "comment_submit"
  | "comment_like"
  | "scroll_75"
  | "cheer"
  | "rank_row_open"
  | "feed_page"
  | "pick_save" // 홈 내 최애 저장. count(고른 수)·from(home·edit)
  // ── 가이드·저장 (docs/monetize/PLAN.md §8). params 는 평면으로:
  // kind·id(저장·평가 항목), partner·placement·item·tagged(제휴), choice·facet(평가), quiz·result(테스트), from·to(레일 이동), count(개수)
  | "save"
  | "unsave"
  | "saved_view"
  | "saved_share"
  | "saved_import"
  | "affiliate_click"
  | "item_vote"
  | "quiz_start"
  | "quiz_complete"
  | "quiz_share"
  | "guide_tile_open"
  | "guide_teaser_click"
  | "cross_rail_click"
  | "visited_stamp"
  | "buy_box_view"
  // ── 앱 수요 재기 (docs/decisions/app-2026-10-21.md). mode(android·ios)·trigger(scroll·save)·outcome(accepted·dismissed)·source(saved·quiz)
  | "install_prompt_view"
  | "install_click"
  | "install_dismiss"
  | "app_installed"
  | "pwa_open"
  | "subscribe_view"
  | "subscribe_submit";

export function track(name: TrackEvent, params?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;
  const props = { ...params, platform: appPlatform() };
  window.gtag?.("event", name, props);
  capturePosthog(name, props); // posthog-js 는 첫 화면 뒤에 따로 불러온다 (lib/posthog.ts)
}
