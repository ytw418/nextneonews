import { assertRobotsAllowed } from "./robots";

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

// 모든 수집 요청은 robots.txt 를 먼저 확인한다
export async function fetchHtml(url: string): Promise<string> {
  await assertRobotsAllowed(url, USER_AGENT);
  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT, "accept-language": "ko-KR,ko;q=0.9" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status}`);
  }
  return res.text();
}

export function parseCount(text: string | undefined): number | undefined {
  const digits = text?.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : undefined;
}
