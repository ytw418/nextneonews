import * as cheerio from "cheerio";

import { fetchHtml } from "./http";
import type { CollectedSignal, Collector } from "./types";

// 연예 매체 첫 화면·연예 목록의 기사 제목·링크 (robots.txt 허용, OSEN·엑스포츠 2026-10-22, 나머지 10-23 확인).
// 네이버 연예 랭킹은 robots.txt 가 막아서, 네이버에 기사를 보내는 매체를 직접 본다. 본문은 글 쓸 때 sources.ts 가 읽는다
const PAGES: { source: string; url: string; id: RegExp }[] = [
  { source: "osen", url: "https://www.osen.co.kr/", id: /\/article\/(G\d+)/ },
  { source: "xportsnews", url: "https://www.xportsnews.com/?ac=article_list&entry_id=entertainment", id: /\/article\/(\d+)/ },
  { source: "dispatch", url: "https://www.dispatch.co.kr/category/news", id: /^(?:https:\/\/www\.dispatch\.co\.kr)?\/(\d{5,})\/?$/ },
  { source: "tenasia", url: "https://www.tenasia.co.kr/music", id: /tenasia\.co\.kr\/article\/(\d+)/ },
  { source: "tenasia", url: "https://www.tenasia.co.kr/tv-drama", id: /tenasia\.co\.kr\/article\/(\d+)/ },
  { source: "sportsseoul", url: "https://www.sportsseoul.com/entertainment", id: /\/news\/read\/(\d+)/ },
];

const MIN_TITLE = 12;

export function parseMediaPage(html: string, page: (typeof PAGES)[number]): CollectedSignal[] {
  const $ = cheerio.load(html);
  const seen = new Map<string, CollectedSignal>();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href") ?? "";
    const id = href.match(page.id)?.[1];
    // 디스패치는 제목 끝에 '2026.10.23 오전 08:49' 가 붙는다
    const title = $(a).text().replace(/\s+/g, " ").trim().replace(/\s*\d{4}\.\d{2}\.\d{2} 오[전후] \d{2}:\d{2}$/, "").trim();
    if (!id || title.length < MIN_TITLE) return;
    // 같은 기사가 여러 칸에 나오면 제목이 가장 긴 것
    if ((seen.get(id)?.title.length ?? 0) >= title.length) return;
    seen.set(id, { source: page.source, externalId: id, title, url: new URL(href, page.url).href, lang: "ko", metrics: {} });
  });
  return [...seen.values()];
}

export const mediaCollector: Collector = {
  name: "media",
  async collect() {
    const signals: CollectedSignal[] = [];
    for (const page of PAGES) {
      // 한 매체가 막히거나 구조가 바뀌어도 나머지는 모은다
      const html = await fetchHtml(page.url).catch(() => null);
      if (html) signals.push(...parseMediaPage(html, page));
    }
    return signals;
  },
};
