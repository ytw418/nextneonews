import * as cheerio from "cheerio";

import { fetchHtml } from "../collectors/http";
import { log } from "../log";

// 원문을 못 읽는 경우 (본문 구조 변경, 삭제된 글). 다시 시도해도 같으므로 주제를 건너뛴다.
export class SourceUnavailableError extends Error {}

export interface SourceMaterial {
  url: string;
  publisher: string;
  kind: "NEWS" | "COMMUNITY";
  text: string; // 사실 추출용으로만 쓰고 저장하지 않는다 (docs/production.md ②)
  comments: string[];
}

const MAX_TEXT = 8000;
const MAX_COMMENTS = 5;

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function capped(text: string, url: string): string {
  if (text.length <= MAX_TEXT) return text;
  log.warn("source: text truncated", { url, length: text.length, kept: MAX_TEXT });
  return text.slice(0, MAX_TEXT);
}

async function naverArticle(url: string): Promise<SourceMaterial> {
  const $ = cheerio.load(await fetchHtml(url));
  $("._article_content .img_desc, ._article_content script").remove();
  const text = clean($("._article_content").first().text());
  if (!text) {
    throw new SourceUnavailableError(`naver article body not found: ${url}`);
  }
  const publisher = clean($('[class*="press_name"]').first().text()) || "Naver Entertainment";
  return { url, publisher, kind: "NEWS", text: capped(text, url), comments: [] };
}

async function pannPost(url: string): Promise<SourceMaterial> {
  const $ = cheerio.load(await fetchHtml(url));
  const body = clean($("#contentArea").first().text());
  if (!body) {
    throw new SourceUnavailableError(`pann post body not found: ${url}`);
  }
  // 베스트 댓글이 먼저 나온다
  const comments = $(".usertxt")
    .map((_, el) => clean($(el).text()))
    .get()
    .filter((c) => c.length > 0)
    .slice(0, MAX_COMMENTS);
  return { url, publisher: "Nate Pann", kind: "COMMUNITY", text: capped(body, url), comments };
}

const MIN_TEXT = 80;
const MIN_COMMENTS = 3;

async function read(signal: { source: string; url: string }): Promise<SourceMaterial> {
  switch (signal.source) {
    case "naver-entertain":
      return naverArticle(signal.url);
    case "pann":
      return pannPost(signal.url);
    default:
      throw new SourceUnavailableError(`no source reader for ${signal.source}`);
  }
}

export async function fetchSourceMaterial(signal: { source: string; url: string }): Promise<SourceMaterial> {
  const material = await read(signal);
  // 본문이 거의 없고(이미지 글) 댓글도 적으면 사실을 뽑을 수 없다
  if (material.text.length < MIN_TEXT && material.comments.length < MIN_COMMENTS) {
    throw new SourceUnavailableError(`source too thin: ${signal.url}`);
  }
  return material;
}
