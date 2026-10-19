import { describe, expect, it } from "vitest";

import { DAILY_SITEMAP_PATTERNS, pickSitemapPaths, renderPath } from "./site";

describe("site", () => {
  // 주소 접두사(/zh-tw)로 비우면 실제 캐시(/zh-TW)가 그대로 남는다 — 새 글이 화면에 안 나오는데 오류도 없다
  it("브라우저 주소를 실제로 그리는 경로로 바꾸고, 점이 든 경로는 그대로 둔다", () => {
    expect(renderPath("/zh-tw/news/a-1")).toBe("/zh-TW/news/a-1");
    expect(renderPath("/zh-tw")).toBe("/zh-TW");
    expect(renderPath("/zh-tw/feed.xml")).toBe("/zh-tw/feed.xml");
    expect(renderPath("/en/c/kpop")).toBe("/en/c/kpop");
  });

  it("사이트맵에서 하루 1번 다시 그릴 주소(인물·가이드)만 고른다", () => {
    const xml = [
      "https://unnienote.app/en",
      "https://unnienote.app/ja/idol/newjeans",
      "https://unnienote.app/zh-tw/beauty/p/laneige?x=1&amp;y=2",
      "https://unnienote.app/en/news/some-article-1a2b3c",
      "https://unnienote.app/en/rankings/idol-buzz",
    ]
      .map((loc) => `<url><loc>${loc}</loc></url>`)
      .join("");
    expect(pickSitemapPaths(xml, DAILY_SITEMAP_PATTERNS)).toEqual(["/ja/idol/newjeans", "/zh-tw/beauty/p/laneige"]);
  });
});
