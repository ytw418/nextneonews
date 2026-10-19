import "server-only";

import { z } from "zod";

// '한국에서 지금 듣는 노래' (/drama 허브): 애플 뮤직 한국 인기곡 RSS (애플 공개 마케팅 도구, 키 없음).
// 이용 조건을 확인하기 전까지 기본은 꺼 둔다 — 환경변수 KPOP_CHART=on 일 때만 부른다 (docs/monetize/BM-VALIDATION.md P6-2).
// 실패(네트워크·형식·빈 목록)하면 null 이라 화면은 레일을 숨긴다. DB 에 저장하지 않고 한 시간마다 다시 받는다

export const KPOP_CHART_URL = "https://rss.marketingtools.apple.com/api/v2/kr/music/most-played/25/songs.json";
export const KPOP_CHART_SIZE = 10;
const REVALIDATE_SECONDS = 3600;
// 애플이 늦으면 허브 렌더 전체가 기다리므로 짧게 끊는다
const TIMEOUT_MS = 4000;
// 곡 링크는 애플 뮤직 주소만 (피드가 바뀌어도 엉뚱한 곳으로 보내지 않게)
const APPLE_MUSIC = "https://music.apple.com/";

const Feed = z.object({
  feed: z.object({
    updated: z.string(),
    results: z.array(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        artistName: z.string().min(1),
        url: z.string(),
      }),
    ),
  }),
});

export interface ChartSong {
  rank: number;
  id: string;
  title: string;
  artist: string;
  url: string;
}

export interface KpopChart {
  songs: ChartSong[];
  updatedAt: Date;
}

export function kpopChartEnabled(): boolean {
  return process.env.KPOP_CHART?.trim().toLowerCase() === "on";
}

export function parseKpopChart(json: unknown): KpopChart | null {
  const parsed = Feed.safeParse(json);
  if (!parsed.success) return null;
  const songs = parsed.data.feed.results
    .filter((r) => r.url.startsWith(APPLE_MUSIC))
    .slice(0, KPOP_CHART_SIZE)
    .map((r, i) => ({ rank: i + 1, id: r.id, title: r.name, artist: r.artistName, url: r.url }));
  const updatedAt = new Date(parsed.data.feed.updated);
  if (songs.length === 0 || Number.isNaN(updatedAt.getTime())) return null;
  return { songs, updatedAt };
}

export async function getKpopChart(): Promise<KpopChart | null> {
  if (!kpopChartEnabled()) return null;
  try {
    const res = await fetch(KPOP_CHART_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return parseKpopChart(await res.json());
  } catch {
    return null;
  }
}
