import { describe, expect, it } from "vitest";

import { faqNotInBody, readMinutes } from "./article";

describe("글 페이지", () => {
  it("본문 소제목과 같은 질문만 FAQ 에서 뺀다 (대소문자·문장부호 무시)", () => {
    const body = "Intro\n\n## When does Love in Disguise premiere?\n\nText\n\n## Who are the lead actors\n";
    const faq = [{ q: "When does love in disguise premiere" }, { q: "Where can I watch it?" }];
    expect(faqNotInBody(faq, body)).toEqual([{ q: "Where can I watch it?" }]);
  });

  it("라틴 단어는 220개, 한중일 글자는 500자를 1분으로 센다", () => {
    expect(readMinutes("word ".repeat(660))).toBe(3);
    expect(readMinutes("가".repeat(1000))).toBe(2);
    expect(readMinutes("[short](https://example.com/a/very/long/url)")).toBe(1);
  });
});
