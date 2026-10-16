import { describe, expect, it } from "vitest";

import { isAllowed, parseRobots, robotsFromResponse } from "./robots";

describe("robots.txt", () => {
  it("User-agent * 묶음의 가장 긴 규칙을 따른다", () => {
    const rules = parseRobots(`User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\nDisallow: /rss/search\nAllow: /rss/search/ok\nDisallow: /*.php$`);
    expect(isAllowed(rules, "/rss/topics")).toBe(true);
    expect(isAllowed(rules, "/rss/search?q=x")).toBe(false);
    expect(isAllowed(rules, "/rss/search/ok")).toBe(true);
    expect(isAllowed(rules, "/index.php")).toBe(false);
    expect(isAllowed(parseRobots("User-agent: *\nDisallow: /"), "/talk/1")).toBe(false);
  });

  it("robots.txt 가 403(확인 화면)이면 전부 금지로 본다", async () => {
    const { rules } = await robotsFromResponse(new Response("Just a moment...", { status: 403 }));
    expect(isAllowed(rules, "/pt")).toBe(false);
  });
});
