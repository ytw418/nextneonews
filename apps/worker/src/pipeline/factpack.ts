import { RobotsDisallowedError } from "../collectors/robots";
import { log } from "../log";
import { pickSentences } from "./extract";
import { readPage } from "./sources";

// 가이드 글의 사실 목록: 공식 페이지(K-ETA·생활법령·하이코리아 등)에서 필요한 부분만 가져온다.
// AI 는 여기 있는 숫자·날짜·요금만 쓸 수 있다 (docs/PRD.md 5장, docs/research/topics-2026-10.md 4장)

export interface FactSource {
  url: string;
  publisher: string;
  text: string;
}

const PER_PAGE = 2500;
const TOTAL = 7000;
// 이보다 적으면 사실을 확인할 수 없으니 쓰지 않는다
export const MIN_FACT_CHARS = 400;

export async function buildFactPack(urls: string[], keywords: string[]): Promise<FactSource[]> {
  const pack: FactSource[] = [];
  let total = 0;
  for (const url of urls) {
    if (total >= TOTAL) break;
    try {
      const { publisher, text } = await readPage(url, new URL(url).hostname);
      if (text.length < 100) continue;
      const picked = pickSentences(text, keywords, Math.min(PER_PAGE, TOTAL - total));
      pack.push({ url, publisher, text: picked });
      total += picked.length;
    } catch (error) {
      // robots.txt 금지·접속 실패·자바스크립트로만 그려지는 페이지는 건너뛴다
      log.warn("factpack: page skipped", {
        url,
        reason: error instanceof RobotsDisallowedError ? "robots" : String(error).slice(0, 120),
      });
    }
  }
  return pack;
}
