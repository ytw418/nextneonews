import * as cheerio from "cheerio";

import { fetchHtml } from "./http";
import type { CollectedSignal, Collector } from "./types";

// 아이돌차트(idol-chart.com, 스탯티즈) 주간 아차랭킹 1쪽(20팀) 이름 (robots.txt 전체 허용·Crawl-delay 5, 2026-10-23 확인).
// 화제 신호로만 쓴다: 제목이 가수 이름이라 같은 인물의 매체 기사와 한 주제로 묶이고, 순위가 점수 보너스가 된다 (totalScore)
const RANKING = "https://m.idol-chart.com/ranking/";

export function parseIdolChart(html: string): CollectedSignal[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const signals: CollectedSignal[] = [];
  $('a[href*="/profile/?pno="] .txt01').each((_, el) => {
    const pno = $(el).closest("a").attr("href")?.match(/pno=(\d+)/)?.[1];
    const name = $(el).text().replace(/\s+/g, " ").trim();
    if (!pno || !name || seen.has(pno)) return;
    seen.add(pno);
    signals.push({
      source: "idolchart",
      externalId: pno,
      title: name,
      url: `https://m.idol-chart.com/profile/?pno=${pno}`,
      lang: "ko",
      metrics: { rank: signals.length + 1 },
    });
  });
  return signals;
}

export const idolChartCollector: Collector = {
  name: "idolchart",
  async collect() {
    return parseIdolChart(await fetchHtml(RANKING));
  },
};
