import { setTimeout as sleep } from "node:timers/promises";

import * as cheerio from "cheerio";

import { log } from "../log";
import { BlockedError, fetchHtml, parseCount } from "./http";
import type { CollectedSignal, Collector } from "./types";

// 더쿠 게시판 목록 (robots.txt 허용, 정직한 봇 UA). 한국 팬덤이 지금 무엇에 반응하는지 보는 신호로만 쓴다.
// 제목·글 번호·말머리·댓글 수·조회 수·시각만 저장한다. 본문·이미지·닉네임은 가져오지 않는다 (docs/PRD.md 5장).
// 목록은 최신순이라 순위가 아니다 → 조회 증가 속도(store.ts velocity)로 본다
const BASE = "https://theqoo.net";
// HOT · 스퀘어 · 드영배(드라마·영화·배우) · 예능
export const BOARDS = ["hot", "square", "dyb", "yn"] as const;
// 같은 호스트에 연달아 보낼 때 쉬는 시간
const PAUSE_MS = 2_000;

const KST_OFFSET_MS = 9 * 3600_000;

function kstIso(year: number, month: number, day: number, hour = 0, minute = 0): string {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - KST_OFFSET_MS).toISOString();
}

// 목록의 시각 칸 (KST) → ISO. 오늘 글은 "HH:MM", 올해 지난 글은 "MM.DD", 그 전은 "YY.MM.DD"
export function parsePostedAt(text: string, now = new Date()): string | undefined {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const year = kst.getUTCFullYear();
  const value = text.trim();
  let m = value.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return kstIso(year, kst.getUTCMonth() + 1, kst.getUTCDate(), Number(m[1]), Number(m[2]));
  m = value.match(/^(\d{2})\.(\d{2})$/);
  if (m) {
    const iso = kstIso(year, Number(m[1]), Number(m[2]));
    // 1월 초에 보이는 "12.31" 은 작년이다
    return Date.parse(iso) > now.getTime() ? kstIso(year - 1, Number(m[1]), Number(m[2])) : iso;
  }
  m = value.match(/^(\d{2})\.(\d{2})\.(\d{2})$/);
  if (m) return kstIso(2000 + Number(m[1]), Number(m[2]), Number(m[3]));
  return undefined;
}

// 게시판 목록 한 쪽 → 신호. 공지(.notice)와 '모든 공지 확인하기' 줄(.notice_expand)은 뺀다
export function parseBoard(html: string, mid: string, now = new Date()): CollectedSignal[] {
  const $ = cheerio.load(html);
  const signals: CollectedSignal[] = [];
  $("table.theqoo_board_table tbody tr").each((_, el) => {
    const row = $(el);
    if (row.hasClass("notice") || row.hasClass("notice_expand")) return;
    const link = row.find(`td.title a[href^="/${mid}/"]`).not(".replyNum").first();
    const id = link.attr("href")?.match(/\/(\d+)$/)?.[1];
    // 제목 끝의 ".jpg", ".twt" 같은 꼬리는 뗀다
    const text = link.text().replace(/\.(jpg|jpeg|gif|png|twt|mp4|txt)\s*$/i, "").trim();
    if (!id || !text) return;
    // 드영배·예능의 머리말(작품·프로그램 이름)은 제목 앞에 붙인다. 제목만으로는 무슨 작품 얘기인지 모르는 글이 많다
    const preface = row.find("td.title a.preface").first().text().trim();
    signals.push({
      source: "theqoo",
      externalId: id,
      title: preface ? `[${preface}] ${text}` : text,
      url: `${BASE}/${mid}/${id}`,
      lang: "ko",
      metrics: {
        views: parseCount(row.find("td.m_no").last().text()),
        // 댓글이 없으면 숫자 링크도 없다
        comments: parseCount(row.find("td.title a.replyNum").first().text()) ?? 0,
        mid,
        cate: row.find("td.cate span").first().text().trim() || undefined,
        postedAt: parsePostedAt(row.find("td.time").first().text(), now),
      },
    });
  });
  return signals;
}

export const theqooCollector: Collector = {
  name: "theqoo",
  async collect() {
    const byId = new Map<string, CollectedSignal>();
    const failures: unknown[] = [];
    for (const [i, mid] of BOARDS.entries()) {
      if (i > 0) await sleep(PAUSE_MS);
      try {
        const rows = parseBoard(await fetchHtml(`${BASE}/${mid}`), mid);
        if (rows.length === 0) log.warn("theqoo: no rows (목록 구조가 바뀌었는지 확인)", { mid });
        for (const row of rows) if (!byId.has(row.externalId)) byId.set(row.externalId, row);
      } catch (error) {
        // 막힘(403 등)은 건너뜀으로만 남긴다. 게시판 하나가 실패해도 나머지는 계속한다
        failures.push(error);
        log.warn(`theqoo: ${error instanceof BlockedError ? "skipped" : "failed"} ${mid}`, { error: String(error) });
      }
    }
    // 전부 실패했는데 막힘이 아닌 오류가 있으면 실패로 올린다 (구조 변경·코드 오류를 놓치지 않게)
    const unexpected = failures.find((error) => !(error instanceof BlockedError));
    if (failures.length === BOARDS.length && unexpected) throw unexpected;
    return [...byId.values()];
  },
};
