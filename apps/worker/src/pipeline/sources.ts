import * as cheerio from "cheerio";

import { fetchHtml } from "../collectors/http";
import { RobotsDisallowedError } from "../collectors/robots";
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

// 언론사 기사 본문. 사이트마다 구조가 달라 흔한 본문 자리를 차례로 찾고, 없으면 <p> 를 모은다
const BODY_SELECTORS = [
  ".story-news", // 연합뉴스
  '[itemprop="articleBody"]',
  "#articleBody",
  "#article-view-content-div",
  "#article_body",
  ".article_body",
  ".article-body",
  "#newsct_article",
  "#dic_area",
  ".news_body",
  ".view_con",
  "article",
  "main",
  "#content",
  "#contents",
  ".content",
];

// 페이지 본문과 발행처 이름. 뉴스·공식 페이지 모두 쓴다 (사실 목록 factpack.ts)
export async function readPage(url: string, fallbackPublisher: string): Promise<{ publisher: string; text: string }> {
  const $ = cheerio.load(await fetchHtml(url));
  $("script, style, nav, header, footer, figure, figcaption, .img_desc, .copyright, .reporter_area, iframe").remove();
  let text = "";
  for (const selector of BODY_SELECTORS) {
    const candidate = clean($(selector).first().text());
    if (candidate.length > 200) {
      text = candidate;
      break;
    }
  }
  if (!text) {
    text = clean(
      $("p, li, td")
        .map((_, el) => $(el).text())
        .get()
        .filter((line) => line.trim().length > 40)
        .join(" "),
    );
  }
  const publisher = clean($('meta[property="og:site_name"]').attr("content") ?? "") || fallbackPublisher;
  return { publisher, text };
}

async function newsArticle(url: string, fallbackPublisher: string): Promise<SourceMaterial> {
  const { publisher, text } = await readPage(url, fallbackPublisher);
  if (!text) throw new SourceUnavailableError(`article body not found: ${url}`);
  return { url, publisher, kind: "NEWS", text: capped(text, url), comments: [] };
}

// 더쿠 글: 대부분 이미지·트윗이라 글이 짧으면 사실 출처로 쓰지 않는다 (아래 MIN_TEXT 검사)
async function theqooPost(url: string): Promise<SourceMaterial> {
  const $ = cheerio.load(await fetchHtml(url));
  const text = clean($(".rd_body .xe_content").first().text());
  return { url, publisher: "theqoo", kind: "COMMUNITY", text: capped(text, url), comments: [] };
}

const MIN_TEXT = 80;
const MIN_COMMENTS = 3;

async function read(signal: { source: string; url: string }): Promise<SourceMaterial> {
  try {
    switch (signal.source) {
      case "yonhap":
        return await newsArticle(signal.url, "Yonhap News");
      case "google-trends":
        return await newsArticle(signal.url, new URL(signal.url).hostname);
      case "theqoo":
        return await theqooPost(signal.url);
      default:
        throw new SourceUnavailableError(`no source reader for ${signal.source}`);
    }
  } catch (error) {
    // robots.txt 금지·삭제된 글은 다시 시도해도 같다
    if (error instanceof RobotsDisallowedError) throw new SourceUnavailableError(error.message);
    throw error;
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
