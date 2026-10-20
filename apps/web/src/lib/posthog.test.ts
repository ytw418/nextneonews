import { describe, expect, it, vi } from "vitest";

import { captureErrorPosthog, capturePosthog, loadPosthog } from "./posthog";
import { shouldSend } from "./posthog-server";

const { init, capture, captureException } = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  captureException: vi.fn(),
}));
vi.mock("posthog-js", () => ({ default: { init, capture, captureException } }));

// PostHog 를 늦게 받으면서 그 전 이벤트(저장·투표 등)를 잃지 않는지
describe("PostHog 지연 로드", () => {
  it("토큰이 없으면 버리고, 받기 전 이벤트는 모았다가 init 뒤 순서대로 보낸다", async () => {
    capturePosthog("save");
    let load = () => {};
    loadPosthog("key", {}, (start) => {
      load = start;
    });
    capturePosthog("share");
    capturePosthog("poll_vote", { id: "1" });
    // 에러도 받기 전 것을 모으고, 같은 에러는 한 번만, 광고 스크립트 안에서 난 것은 보내지 않는다
    const hydration = new Error("Hydration failed");
    hydration.stack = "Error: Hydration failed\n    at https://unnienote.app/_next/static/chunks/0a1b.js:1:2";
    captureErrorPosthog(hydration);
    captureErrorPosthog(new Error("Hydration failed"));
    const ad = new Error("adsbygoogle.push() error");
    ad.stack = "TagError\n    at https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js:1:2";
    captureErrorPosthog(ad);
    expect(init).not.toHaveBeenCalled();

    load();
    await vi.waitFor(() => expect(init).toHaveBeenCalledWith("key", {}));
    capturePosthog("reaction");
    expect(capture.mock.calls).toEqual([["share", undefined], ["poll_vote", { id: "1" }], ["reaction", undefined]]);
    expect(captureException.mock.calls).toEqual([[hydration]]);
  });

  it("서버 에러는 같은 화면·같은 에러를 10분에 한 번만 보낸다 (DB 장애 때 한도를 지킨다)", () => {
    expect(shouldSend("/[locale]/news/[slug] Error: db down", 0)).toBe(true);
    expect(shouldSend("/[locale]/news/[slug] Error: db down", 60_000)).toBe(false);
    expect(shouldSend("/[locale]/idol/[slug] Error: db down", 60_000)).toBe(true);
    expect(shouldSend("/[locale]/news/[slug] Error: db down", 10 * 60_000)).toBe(true);
  });
});
