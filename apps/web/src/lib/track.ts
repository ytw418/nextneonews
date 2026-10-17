import posthog from "posthog-js";

// 분석 이벤트. GA4(gtag 는 운영에서 GA ID 가 있을 때만, components/Analytics.tsx)와
// PostHog(운영에서만 init, instrumentation-client.ts)에 같은 이름으로 보낸다. 둘 다 없으면 아무것도 하지 않는다
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
  | "scroll_75"
  | "cheer"
  | "rank_row_open"
  | "feed_page";

export function track(name: TrackEvent, params?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params ?? {});
  if (posthog.__loaded) posthog.capture(name, params);
}
