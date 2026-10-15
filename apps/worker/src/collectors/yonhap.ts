import * as cheerio from "cheerio";

import { fetchHtml } from "./http";
import type { CollectedSignal, Collector } from "./types";

// 연합뉴스 분야별 RSS (robots.txt 허용). 사실 확인용 1차 뉴스.
// 연예·문화(음식·여행·축제)·산업(화장품·식품 기업)·사회(비자·외국인 정책)
const FEEDS = ["entertainment", "culture", "industry", "society"];

export const yonhapCollector: Collector = {
  name: "yonhap",
  async collect() {
    const signals: CollectedSignal[] = [];
    for (const feed of FEEDS) {
      const $ = cheerio.load(await fetchHtml(`https://www.yna.co.kr/rss/${feed}.xml`), { xml: true });
      $("item").each((_, item) => {
        const url = $(item).children("link").text().trim();
        const id = url.match(/\/view\/(AKR\d+)/)?.[1];
        const title = $(item).children("title").text().trim();
        if (!id || !title) return;
        signals.push({ source: "yonhap", externalId: id, title, url, lang: "ko", metrics: {} });
      });
    }
    return signals;
  },
};
