import * as cheerio from "cheerio";

import { fetchHtml } from "./http";
import type { CollectedSignal, Collector } from "./types";

// 케이아지트(kagit.kr) 첫 화면의 화제 글 제목 (robots.txt 허용, 2026-10-22 확인).
// 무엇이 화제인지 보는 신호로만 쓴다: 본문은 읽지도 옮기지도 않고, 글은 같은 인물의 매체 기사로 쓴다 (sources.ts)
const HOME = "https://kagit.kr/ko";

export function parseKagit(html: string): CollectedSignal[] {
  const $ = cheerio.load(html);
  const best = new Map<string, CollectedSignal>();
  $('a[href^="/ko/posts/"]').each((_, a) => {
    const href = $(a).attr("href")!;
    const slug = href.split("/").pop()!;
    // 카드 안 여러 줄(제목·요약) 중 가장 긴 줄
    const title = $(a)
      .find("*")
      .addBack()
      .contents()
      .filter((_, n) => n.type === "text")
      .map((_, n) => $(n).text().trim())
      .get()
      .reduce((a, b) => (b.length > a.length ? b : a), "");
    if (title.length < 8 || (best.get(slug)?.title.length ?? 0) >= title.length) return;
    best.set(slug, { source: "kagit", externalId: slug, title, url: new URL(href, HOME).href, lang: "ko", metrics: {} });
  });
  return [...best.values()];
}

export const kagitCollector: Collector = {
  name: "kagit",
  async collect() {
    return parseKagit(await fetchHtml(HOME));
  },
};
