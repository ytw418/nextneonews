import { log } from "../log";

const ENDPOINT = "https://api.indexnow.org/indexnow";

// 새 글 URL 을 IndexNow 참여 검색엔진(Bing 등)에 바로 알린다. 로컬·키 없음이면 건너뛴다.
// 알림이 실패해도 경고만 남긴다 (발행·번역은 이미 끝났다)
export async function notifyIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  const siteUrl = process.env.SITE_URL;
  if (urls.length === 0) return;
  if (!key || !siteUrl) {
    log.info("indexnow: skipped (INDEXNOW_KEY or SITE_URL not set)");
    return;
  }
  const { host } = new URL(siteUrl);
  if (host.startsWith("localhost") || host.startsWith("127.")) {
    log.info("indexnow: skipped (local site)", { urls: urls.length });
    return;
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation: `${siteUrl}/indexnow.txt`, urlList: urls }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      log.info("indexnow: submitted", { urls: urls.length, status: res.status });
    } else {
      log.warn("indexnow: rejected", { status: res.status, body: await res.text() });
    }
  } catch (error) {
    log.warn("indexnow: failed", { error: String(error) });
  }
}
