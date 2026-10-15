import type { CollectedSignal, Collector } from "./types";

// 네이버 엔터 '많이 본 뉴스' 랭킹. 화면(m.entertain.naver.com/ranking)이 쓰는 JSON 을 직접 받는다.
const API = "https://api-gw.entertain.naver.com/ranking/most-viewed";

interface RankingArticle {
  rank: number;
  officeId: string;
  articleId: string;
  title: string;
  count: number;
  url: string;
}

function kstDate(daysAgo = 0): string {
  const date = new Date(Date.now() - daysAgo * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date).replaceAll("-", "");
}

// 특정 날짜(daysAgo 일 전) 랭킹. 지난 날짜도 같은 API 로 받을 수 있다
export async function collectNaverRanking(daysAgo = 0): Promise<CollectedSignal[]> {
    const res = await fetch(`${API}?date=${kstDate(daysAgo)}&pageSize=30`, {
      headers: { referer: "https://m.entertain.naver.com/ranking" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`naver ranking -> ${res.status}`);
    }

    const data = (await res.json()) as { result?: { articles?: RankingArticle[] } };
    const articles = data.result?.articles;
    if (!Array.isArray(articles)) {
      throw new Error("naver ranking: unexpected response shape");
    }

    return articles.map(
      (a): CollectedSignal => ({
        source: "naver-entertain",
        externalId: `${a.officeId}-${a.articleId}`,
        title: a.title,
        url: a.url,
        lang: "ko",
        metrics: { rank: a.rank, views: a.count },
      }),
    );
}

export const naverEntertainCollector: Collector = {
  name: "naver-entertain",
  collect: () => collectNaverRanking(0),
};
