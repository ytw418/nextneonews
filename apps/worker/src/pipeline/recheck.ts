import { prisma } from "@kmedia/db";

import { USER_AGENT } from "../collectors/http";
import { assertRobotsAllowed, RobotsDisallowedError } from "../collectors/robots";
import { log } from "../log";

// 원문 기사가 삭제되면(404·410) 우리 글도 내리고 사람 확인을 기다린다.
// 정정·삭제된 보도를 계속 유통하면 명예훼손 배상액 판단에 불리하다 (정보통신망법 44조의10, docs/PRD.md 10장)
const DAYS = 30;
const GONE = new Set([404, 410]);

export async function recheckSources(): Promise<void> {
  const since = new Date(Date.now() - DAYS * 86_400_000);
  const sources = await prisma.sourceRef.findMany({
    where: { kind: "NEWS", article: { status: "PUBLISHED", publishedAt: { gte: since } } },
    select: { url: true, articleId: true },
  });
  let unpublished = 0;
  for (const { url, articleId } of sources) {
    try {
      await assertRobotsAllowed(url, USER_AGENT);
      const res = await fetch(url, {
        method: "GET",
        headers: { "user-agent": USER_AGENT },
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
      });
      if (!GONE.has(res.status)) continue;
      await prisma.article.update({ where: { id: articleId }, data: { status: "REVIEW" } });
      unpublished += 1;
      log.warn("recheck: source gone, article moved to REVIEW", { articleId, url, status: res.status });
    } catch (error) {
      // 일시적인 접속 실패·robots 금지는 판단하지 않는다
      if (!(error instanceof RobotsDisallowedError)) log.warn("recheck: fetch failed", { url, error: String(error).slice(0, 100) });
    }
  }
  log.info("recheck: done", { checked: sources.length, unpublished });
}
