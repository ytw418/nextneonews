import { describe, expect, it, vi } from "vitest";

import { capturePosthog, loadPosthog } from "./posthog";

const { init, capture } = vi.hoisted(() => ({ init: vi.fn(), capture: vi.fn() }));
vi.mock("posthog-js", () => ({ default: { init, capture } }));

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
    expect(init).not.toHaveBeenCalled();

    load();
    await vi.waitFor(() => expect(init).toHaveBeenCalledWith("key", {}));
    capturePosthog("reaction");
    expect(capture.mock.calls).toEqual([["share", undefined], ["poll_vote", { id: "1" }], ["reaction", undefined]]);
  });
});
