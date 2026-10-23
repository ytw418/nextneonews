import * as cheerio from "cheerio";

import { BlockedError, fetchHtml, fetchText, USER_AGENT } from "../collectors/http";
import { contentSignals, RobotsDisallowedError } from "../collectors/robots";
import { log } from "../log";

// 원문을 못 읽는 경우 (본문 구조 변경, 삭제된 글). 다시 시도해도 같으므로 주제를 건너뛴다.
export class SourceUnavailableError extends Error {}

export interface SourceMaterial {
  url: string;
  publisher: string;
  kind: "NEWS" | "COMMUNITY";
  text: string; // 사실 추출용으로만 쓰고 저장하지 않는다 (docs/production.md ②)
  comments: string[]; // 반응 요약용으로만 쓰고 저장하지 않는다
}

// fact: 글의 사실 출처 (뉴스·공식 페이지만) / reaction: 한국 반응 (커뮤니티 댓글)
export type SourceRole = "fact" | "reaction";

type SignalRef = { source: string; url: string; externalId?: string };

const MAX_TEXT = 8000;
const MAX_REACTION_COMMENTS = 100;

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
  ".news_contents", // 엑스포츠뉴스
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

// robots.txt 의 Content-Signal 이 ai-input=no 면 원문을 AI 에 넘기지 않는다
async function assertAiInputAllowed(url: string): Promise<void> {
  const { origin } = new URL(url);
  if ((await contentSignals(origin, USER_AGENT))["ai-input"] === "no") {
    throw new SourceUnavailableError(`content-signal ai-input=no: ${origin}`);
  }
}

// 페이지 본문과 발행처 이름. 뉴스·공식 페이지 모두 쓴다 (사실 목록 factpack.ts)
export async function readPage(url: string, fallbackPublisher: string): Promise<{ publisher: string; text: string }> {
  await assertAiInputAllowed(url);
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

// 더쿠 댓글 목록 1쪽(최대 100개, 닉네임 없음). 글 본문·이미지는 가져오지 않는다
const THEQOO_COMMENTS = "https://theqoo.net/index.php";

async function theqooComments(signal: SignalRef): Promise<SourceMaterial> {
  const id = signal.externalId ?? signal.url.match(/\/(\d+)$/)?.[1];
  if (!id || !/^\d+$/.test(id)) throw new SourceUnavailableError(`theqoo document id not found: ${signal.url}`);
  await assertAiInputAllowed(THEQOO_COMMENTS);
  const body = new URLSearchParams({ act: "dispTheqooContentCommentListTheqoo", document_srl: id, cpage: "1" });
  const raw = await fetchText(THEQOO_COMMENTS, { method: "POST", body, accept: "application/json" });
  let data: { comment_list?: { ct?: string }[]; message?: string };
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    throw new SourceUnavailableError(`theqoo comments are not JSON: ${signal.url}`);
  }
  if (!Array.isArray(data.comment_list)) throw new SourceUnavailableError(`theqoo comments: ${data.message ?? "no list"}`);
  const comments = data.comment_list
    .map((c) => c.ct ?? "")
    // 비회원에게는 1시간이 안 된 댓글이 안내문으로 가려져 온다
    .filter((ct) => !ct.includes("commentWarningMessage"))
    .map((ct) => clean(cheerio.load(ct, null, false).text()))
    .filter(Boolean)
    .slice(0, MAX_REACTION_COMMENTS);
  return { url: signal.url, publisher: "theqoo", kind: "COMMUNITY", text: "", comments };
}

const MIN_TEXT = 80;

async function readFact(signal: SignalRef): Promise<SourceMaterial> {
  switch (signal.source) {
    case "yonhap":
      return newsArticle(signal.url, "Yonhap News");
    case "google-trends":
    case "osen":
    case "xportsnews":
    case "dispatch":
    case "tenasia":
    case "sportsseoul":
    case "manual-manual": // 사람이 seed-topic --source manual --url 로 넣은 기사
      return newsArticle(signal.url, new URL(signal.url).hostname);
    case "theqoo":
    case "idolchart": // 순위 신호뿐 (본문 없음)
    case "kagit": // 다른 매체의 글이라 사실 출처로 쓰지 않는다 (화제 신호만)
      // 커뮤니티 글은 사실 출처가 아니다. 더쿠 '기사/뉴스' 글도 본문은 대개 네이버 링크뿐이다
      throw new SourceUnavailableError(`community-only: ${signal.url}`);
    default:
      throw new SourceUnavailableError(`no source reader for ${signal.source}`);
  }
}

async function readReaction(signal: SignalRef): Promise<SourceMaterial> {
  if (signal.source === "theqoo") return theqooComments(signal);
  throw new SourceUnavailableError(`no reaction reader for ${signal.source}`);
}

export async function fetchSourceMaterial(
  signal: SignalRef,
  { role = "fact" }: { role?: SourceRole } = {},
): Promise<SourceMaterial> {
  let material: SourceMaterial;
  try {
    material = role === "reaction" ? await readReaction(signal) : await readFact(signal);
  } catch (error) {
    // robots·약관 금지, 끝까지 막힘(403 등)은 다시 시도해도 같다
    if (error instanceof RobotsDisallowedError || error instanceof BlockedError) throw new SourceUnavailableError(error.message);
    throw error;
  }
  // 본문이 거의 없으면(이미지 글·구조 변경) 사실을 뽑을 수 없다
  if (role === "fact" && material.text.length < MIN_TEXT) {
    throw new SourceUnavailableError(`source too thin: ${signal.url}`);
  }
  return material;
}
