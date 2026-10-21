import { describe, expect, it } from "vitest";

import { parseMessage } from "./bridge";

describe("웹뷰 메시지 해석", () => {
  it("모르는 메시지는 버리고, 저장 목록은 규칙대로 거른다(모르는 종류·중복 제거, 최신순)", () => {
    expect(parseMessage("not json")).toBeNull();
    expect(parseMessage(JSON.stringify({ type: "tab", tab: "settings" }))).toBeNull();
    expect(parseMessage(JSON.stringify({ type: "tab", tab: "guide" }))).toEqual({ type: "tab", tab: "guide" });
    expect(parseMessage(JSON.stringify({ type: "locale", locale: "zh-TW" }))).toEqual({ type: "locale", locale: "zh-TW" });
    expect(parseMessage(JSON.stringify({ type: "locale", locale: "de" }))).toBeNull();
    const saved = parseMessage(
      JSON.stringify({
        type: "saved",
        items: [
          { kind: "beauty", id: "cosrx-snail", at: 1 },
          { kind: "beauty", id: "cosrx-snail", at: 5 },
          { kind: "article", id: "bts-comeback", at: 3 },
          { kind: "unknown", id: "x", at: 9 },
          { kind: "place", id: "../etc", at: 9 },
        ],
      }),
    );
    expect(saved).toEqual({
      type: "saved",
      items: [
        { kind: "beauty", id: "cosrx-snail", at: 5 },
        { kind: "article", id: "bts-comeback", at: 3 },
      ],
    });
  });
});
