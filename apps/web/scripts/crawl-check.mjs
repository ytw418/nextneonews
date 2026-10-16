#!/usr/bin/env node
// 크롤러 눈으로 확인: AI·검색 봇 UA(GPTBot·ClaudeBot·Googlebot)로 서버 HTML 을 받아, 자바스크립트 없이도
// 글(제목·핵심 요약·투표·표 수·국내 반응 요약·Up next 링크), 랭킹(1~10위 이름·ItemList·Dataset), 인물 페이지(sameAs),
// RSS·뉴스 사이트맵·llms.txt 가 보이는지 본다. JSON-LD 는 전부 JSON.parse 해 본다. 하나라도 빠지면 exit 1.
// 사용: npm run crawl-check -- <기준 URL> [--article /en/news/{slug}] [--chart kpop]
//   npm run crawl-check -- http://localhost:3230
// 의존성 없음 (Node 22+ fetch). 글을 지정하지 않으면 사이트맵 앞쪽 영어 글 중 투표·국내 반응이 있는 글을 고른다
const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? "http://localhost:3000").replace(/\/$/, "");
const chart = option("--chart") ?? "kpop";
// 글을 고를 때 받아 보는 최대 수 (운영에서 첫 요청 렌더링을 너무 많이 일으키지 않게)
const SCAN_MAX = 15;

const AGENTS = {
  GPTBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
  ClaudeBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  Googlebot:
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
};

async function get(path, ua) {
  const res = await fetch(base + path, { headers: { "user-agent": ua }, redirect: "follow" });
  return { status: res.status, url: res.url, body: await res.text() };
}

// 태그를 걷어 낸 글자 (엔티티 몇 개만 푼다)
function text(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;| /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 여는 태그 하나부터 같은 이름의 첫 닫는 태그까지 (안에 같은 태그가 다시 없는 블록만 쓴다)
function block(html, open, tag) {
  const start = html.search(open);
  if (start < 0) return null;
  const end = html.indexOf(`</${tag}>`, start);
  return end < 0 ? null : html.slice(start, end + tag.length + 3);
}

// JSON-LD 블록을 모두 파싱한다. 하나라도 깨지면 errors 에 넣는다. @graph 는 펼친다
function jsonLd(html) {
  const nodes = [];
  const errors = [];
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      for (const root of Array.isArray(data) ? data : [data]) nodes.push(...(root["@graph"] ?? [root]));
    } catch (error) {
      errors.push(String(error.message ?? error).slice(0, 80));
    }
  }
  return { nodes, errors, count: nodes.length };
}

const types = (node) => [node?.["@type"]].flat();

// 이 UA 그룹(없으면 *)이 경로를 통째로 막는지 (Disallow: /). 긴 allow 규칙 계산까지는 하지 않는다
function robotsBlocks(robots, botName) {
  const groups = [];
  let current = null;
  for (const raw of robots.split("\n")) {
    const line = raw.replace(/#.*/, "").trim();
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (/^user-agent$/i.test(key)) {
      // 규칙 뒤에 오는 user-agent 는 새 묶음, 연달아 오는 user-agent 는 같은 묶음
      if (!current || current.hasRules) groups.push((current = { agents: [], hasRules: false, disallowAll: false }));
      current.agents.push(value.toLowerCase());
    } else if (current && /^(dis)?allow$/i.test(key)) {
      current.hasRules = true;
      if (/^disallow$/i.test(key) && value === "/") current.disallowAll = true;
    }
  }
  const named = groups.filter((g) => g.agents.includes(botName.toLowerCase()));
  const pick = named.length > 0 ? named : groups.filter((g) => g.agents.includes("*"));
  return pick.some((g) => g.disallowAll);
}

// 글 HTML 의 참여 모듈 유무 (글 고르기·검사 둘 다 쓴다)
function articleParts(html) {
  const poll = block(html, /<section[^>]*id="poll"/, "section");
  const netizen = block(html, /<section[^>]*aria-labelledby="netizen"/, "section");
  return { poll, netizen };
}

async function pickArticle(ua) {
  const given = option("--article");
  if (given) return given;
  // 뉴스 사이트맵(최근 글이 앞)을 먼저, 그다음 전체 사이트맵
  const maps = await Promise.all(["/news-sitemap.xml", "/sitemap.xml"].map(async (path) => (await get(path, ua)).body));
  const locs = maps.flatMap((xml) => [...xml.matchAll(/<loc>([^<]*?\/en\/news\/[^<]+)<\/loc>/g)]);
  const paths = [...new Set(locs.map((m) => new URL(m[1]).pathname))];
  let fallback = null;
  for (const path of paths.slice(0, SCAN_MAX)) {
    const { status, body } = await get(path, ua);
    if (status !== 200) continue;
    const { poll, netizen } = articleParts(body);
    if (poll && netizen) return path;
    if (poll && !fallback) fallback = path;
  }
  return fallback ?? paths[0] ?? null;
}

const results = [];
function check(ua, page, name, ok, detail = "") {
  results.push({ ua, page, name, ok: Boolean(ok), detail });
}

async function checkArticle(ua, path) {
  const page = "article";
  const { status, body } = await get(path, ua);
  check(ua, page, "200", status === 200, `${status} ${path}`);
  if (status !== 200) return;
  const h1s = [...body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => text(m[1]));
  check(ua, page, "h1 하나", h1s.length === 1 && h1s[0].length > 0, h1s[0]?.slice(0, 60));
  const summary = block(body, /<p[^>]*class="article-summary/, "p");
  check(ua, page, "요약 문단", summary && text(summary).length > 20);
  const kp = block(body, /<section[^>]*aria-labelledby="kp"/, "section");
  check(ua, page, "핵심 요약", kp && (kp.match(/<li/g) ?? []).length >= 1, kp ? `${(kp.match(/<li/g) ?? []).length}줄` : "");

  const { poll, netizen } = articleParts(body);
  const question = poll && block(poll, /<h2[^>]*id="poll-q"/, "h2");
  check(ua, page, "투표 질문", question && text(question).length > 5, question ? text(question).slice(0, 60) : "");
  const votes = poll && text(poll).match(/\b\d[\d,.]*\s+votes?\b/);
  check(ua, page, "'N votes'", votes, votes?.[0] ?? "");
  check(ua, page, "국내 반응 요약", netizen && text(netizen).length > 60, netizen ? text(netizen).slice(0, 50) : "");

  const upNext = block(body, /<section[^>]*id="up-next"/, "section");
  const upNextHref = upNext?.match(/<a[^>]*href="(\/[a-z-]+\/news\/[^"]+)"/)?.[1];
  check(ua, page, "Up next <a href>", upNextHref, upNextHref ?? "");

  const md = body.match(/<link[^>]*rel="alternate"[^>]*type="text\/markdown"[^>]*href="([^"]+)"/)?.[1]
    ?? body.match(/<link[^>]*type="text\/markdown"[^>]*href="([^"]+)"/)?.[1];
  check(ua, page, "마크다운판 link", md, md ?? "");
  if (md) {
    const mdRes = await get(new URL(md, base).pathname, ua);
    check(ua, page, "마크다운판 200", mdRes.status === 200, String(mdRes.status));
  }

  const ld = jsonLd(body);
  check(ua, page, "JSON-LD 파싱", ld.errors.length === 0 && ld.count > 0, ld.errors.join(" / ") || `${ld.count}개`);
  const news = ld.nodes.find((n) => types(n).includes("NewsArticle"));
  check(ua, page, "NewsArticle", news?.headline && news?.datePublished && news?.dateModified, news?.dateModified ?? "");
  const crumbs = ld.nodes.find((n) => types(n).includes("BreadcrumbList"));
  check(ua, page, "BreadcrumbList 3단", crumbs?.itemListElement?.length === 3, `${crumbs?.itemListElement?.length ?? 0}단`);
}

async function checkChart(ua) {
  const page = `rankings/${chart}`;
  const { status, body } = await get(`/en/rankings/${chart}`, ua);
  check(ua, page, "200", status === 200, String(status));
  if (status !== 200) return null;
  const ld = jsonLd(body);
  check(ua, page, "JSON-LD 파싱", ld.errors.length === 0 && ld.count > 0, ld.errors.join(" / ") || `${ld.count}개`);
  const list = ld.nodes.find((n) => types(n).includes("ItemList"));
  const top10 = (list?.itemListElement ?? []).slice(0, 10).filter((e) => e?.item?.name);
  check(ua, page, "ItemList 10위", top10.length === 10, `${top10.length}명`);
  // 1~10위 이름이 HTML 글자로 있는지 (1위는 히어로, 2위부터는 줄. 둘 다 id="r-{Q-id}")
  const rows = body.match(/id="r-Q\d+"/g)?.length ?? 0;
  const pageText = text(body);
  const shown = top10.filter((e) => pageText.includes(e.item.name));
  check(ua, page, "1~10위 이름", rows >= 10 && shown.length === 10, `${shown.length}명 (줄 ${rows}개)`);
  const dataset = ld.nodes.find((n) => types(n).includes("Dataset"));
  check(ua, page, "Dataset", dataset?.name && dataset?.distribution?.length, dataset?.license ?? "");
  // 인물 페이지가 있는 첫 순위 (ItemList url 이 /idol/ 이면 slug 가 있다)
  const idol = (list?.itemListElement ?? []).map((e) => e?.item?.url).find((u) => typeof u === "string" && u.includes("/idol/"));
  return idol ? new URL(idol).pathname : null;
}

async function checkIdol(ua, path) {
  const page = "idol";
  if (!path) {
    check(ua, page, "인물 페이지 링크", false, "차트 ItemList 에 /idol/ 주소가 없다");
    return;
  }
  const { status, body } = await get(path, ua);
  check(ua, page, "200", status === 200, `${status} ${path}`);
  if (status !== 200) return;
  const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1];
  check(ua, page, "h1", h1 && text(h1).length > 0, h1 ? text(h1) : "");
  const ld = jsonLd(body);
  check(ua, page, "JSON-LD 파싱", ld.errors.length === 0 && ld.count > 0, ld.errors.join(" / ") || `${ld.count}개`);
  const entity = ld.nodes.find((n) => [n.sameAs].flat().some((s) => typeof s === "string" && s.includes("wikidata.org")));
  check(ua, page, "sameAs 위키데이터", entity, entity ? [entity.sameAs].flat().length + "개" : "");
}

async function checkFeeds(ua) {
  const robots = await get("/robots.txt", ua);
  const name = Object.keys(AGENTS).find((k) => AGENTS[k] === ua);
  check(ua, "robots.txt", "열려 있음", robots.status === 200 && !robotsBlocks(robots.body, name), String(robots.status));
  const files = [
    ["/en/feed.xml", (b) => /<rss[\s>]/.test(b) && /<item>/.test(b)],
    ["/news-sitemap.xml", (b) => /<urlset[\s>]/.test(b)],
    ["/llms.txt", (b) => b.trim().startsWith("#")],
  ];
  for (const [path, valid] of files) {
    const res = await get(path, ua);
    check(ua, path, "200", res.status === 200 && valid(res.body), `${res.status} ${res.body.length}B`);
  }
  const home = await get("/en", ua);
  const ld = jsonLd(home.body);
  check(ua, "home", "JSON-LD 파싱", home.status === 200 && ld.errors.length === 0, ld.errors.join(" / ") || `${ld.count}개`);
}

const article = await pickArticle(AGENTS.Googlebot);
if (!article) {
  console.error(`${base}/sitemap.xml 에 영어 글이 없다`);
  process.exit(1);
}
console.log(`crawl-check ${base} — 글 ${article}, 차트 ${chart}\n`);

for (const ua of Object.values(AGENTS)) {
  await checkFeeds(ua);
  await checkArticle(ua, article);
  const idol = await checkChart(ua);
  await checkIdol(ua, idol);
}

const failed = results.filter((r) => !r.ok);
for (const [name, ua] of Object.entries(AGENTS)) {
  const mine = results.filter((r) => r.ua === ua);
  console.log(`[${name}] ${mine.length - mine.filter((r) => !r.ok).length}/${mine.length}`);
  for (const r of mine) {
    console.log(`  ${r.ok ? "ok  " : "FAIL"} ${r.page.padEnd(18)} ${r.name.padEnd(16)} ${r.detail}`);
  }
}
console.log(failed.length === 0 ? "\n모두 통과" : `\n실패 ${failed.length}건`);
process.exit(failed.length === 0 ? 0 : 1);
