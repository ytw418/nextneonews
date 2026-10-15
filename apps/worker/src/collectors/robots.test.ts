import { describe, expect, it } from "vitest";

import { isAllowed, parseRobots } from "./robots";

describe("robots.txt", () => {
  it("User-agent * 묶음의 가장 긴 규칙을 따른다", () => {
    const rules = parseRobots(`User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\nDisallow: /rss/search\nAllow: /rss/search/ok\nDisallow: /*.php$`);
    expect(isAllowed(rules, "/rss/topics")).toBe(true);
    expect(isAllowed(rules, "/rss/search?q=x")).toBe(false);
    expect(isAllowed(rules, "/rss/search/ok")).toBe(true);
    expect(isAllowed(rules, "/index.php")).toBe(false);
    expect(isAllowed(parseRobots("User-agent: *\nDisallow: /"), "/talk/1")).toBe(false);
  });
});
