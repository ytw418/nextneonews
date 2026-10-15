import * as cheerio from "cheerio";

import { fetchHtml, parseCount } from "./http";
import type { CollectedSignal, Collector } from "./types";

// 구글 트렌드 한국 일간 급상승 RSS (robots.txt 허용). 검색어마다 관련 언론 기사 링크가 붙어 온다.
// 제목은 "검색어 · 대표 기사 제목" 으로 만들어 인물·카테고리 판별에 쓰고, 기사 링크를 원문으로 쓴다.
const RSS = "https://trends.google.com/trending/rss?geo=KR";

function kstDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date).replaceAll("-", "");
}

export const googleTrendsCollector: Collector = {
  name: "google-trends",
  async collect() {
    const $ = cheerio.load(await fetchHtml(RSS), { xml: true });
    const signals: CollectedSignal[] = [];
    $("item").each((i, item) => {
      const keyword = $(item).children("title").first().text().trim();
      const news = $(item).find("ht\\:news_item").first();
      const url = news.find("ht\\:news_item_url").text().trim();
      if (!keyword || !url) return;
      const headline = news.find("ht\\:news_item_title").text().trim();
      const published = new Date($(item).children("pubDate").text());
      signals.push({
        source: "google-trends",
        // 같은 검색어는 하루에 한 줄
        externalId: `${kstDay(Number.isNaN(published.getTime()) ? new Date() : published)}:${keyword}`,
        title: headline ? `${keyword} · ${headline}` : keyword,
        url,
        lang: "ko",
        metrics: { rank: i + 1, likes: parseCount($(item).find("ht\\:approx_traffic").text()) },
      });
    });
    return signals;
  },
};
