import { describe, expect, it } from "vitest";

import { articleMentions } from "./entity-mention";

const kimJiWon = { id: "Q2680695", en: "Kim Ji-won", ko: "김지원" };

describe("articleMentions", () => {
  it("id 가 있는 글은 id 로만 맞춘다 (이름이 같아도 다른 id 면 아니다)", () => {
    expect(articleMentions([{ id: "Q2680695", name: "Kim Ji-won", koreanName: "김지원" }], kimJiWon)).toBe(true);
    expect(articleMentions([{ id: "Q999", name: "Kim Ji-won", koreanName: "김지원" }], kimJiWon)).toBe(false);
  });

  it("id 가 없는 옛 글은 이름으로 맞추되, 한쪽 이름이 다르면 동명이인으로 뺀다", () => {
    expect(articleMentions([{ name: "kim ji-won", koreanName: "김지원" }], kimJiWon)).toBe(true);
    expect(articleMentions([{ name: "Kim Ji-won", koreanName: "김지원(가수)" }], kimJiWon)).toBe(false);
    expect(articleMentions([{ name: "BTS", koreanName: "방탄소년단" }], kimJiWon)).toBe(false);
  });
});
