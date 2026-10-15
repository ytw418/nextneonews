import * as cheerio from "cheerio";

import { fetchHtml, parseCount } from "./http";
import type { CollectedSignal, Collector } from "./types";

const BASE = "https://pann.nate.com";
const RANKING_URL = `${BASE}/talk/ranking`;

// 네이트판 '톡커들의 선택' 랭킹. 서버 렌더링이라 fetch 로 충분하다.
export const pannCollector: Collector = {
  name: "pann",
  async collect() {
    const $ = cheerio.load(await fetchHtml(RANKING_URL));
    const signals: CollectedSignal[] = [];

    $("dl").each((_, dl) => {
      const link = $(dl).find('dt h2 a[href^="/talk/"]').first();
      const href = link.attr("href");
      const id = href?.match(/^\/talk\/(\d+)/)?.[1];
      if (!href || !id) return;

      signals.push({
        source: "pann",
        externalId: id,
        title: (link.attr("title") ?? link.text()).trim(),
        url: `${BASE}${href}`,
        lang: "ko",
        metrics: {
          rank: signals.length + 1,
          views: parseCount($(dl).find(".count").first().text()),
          likes: parseCount($(dl).find(".rcm").first().text()),
          comments: parseCount($(dl).find(".reple-num").first().text()),
        },
      });
    });

    return signals;
  },
};
