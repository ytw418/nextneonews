import * as cheerio from "cheerio";

import { fetchHtml, parseCount } from "./http";
import type { CollectedSignal, Collector } from "./types";

// 더쿠 HOT (robots.txt 허용). 한국 팬덤이 지금 무엇에 반응하는지 보는 신호로만 쓴다.
// 글 본문은 대부분 이미지·트윗이라 사실 출처로 쓰지 않는다 (같은 인물의 뉴스로 글을 쓴다).
const BASE = "https://theqoo.net";

export const theqooCollector: Collector = {
  name: "theqoo",
  async collect() {
    const $ = cheerio.load(await fetchHtml(`${BASE}/hot`));
    const signals: CollectedSignal[] = [];
    $("table.theqoo_board_table tbody tr").each((_, row) => {
      if ($(row).hasClass("notice")) return;
      const link = $(row).find('td.title a[href^="/hot/"]').first();
      const id = link.attr("href")?.match(/^\/hot\/(\d+)/)?.[1];
      // 제목 끝의 ".jpg", ".twt" 같은 꼬리는 뗀다
      const title = link.text().replace(/\.(jpg|jpeg|gif|png|twt|mp4|txt)\s*$/i, "").trim();
      if (!id || !title) return;
      const cells = $(row).find("td");
      signals.push({
        source: "theqoo",
        externalId: id,
        title,
        url: `${BASE}/hot/${id}`,
        lang: "ko",
        metrics: {
          rank: signals.length + 1,
          comments: parseCount($(row).find("td.title a.replyNum").first().text()),
          views: parseCount(cells.last().text()),
        },
      });
    });
    return signals;
  },
};
