import type Anthropic from "@anthropic-ai/sdk";

import { prisma } from "@kmedia/db";

import { assertBudget } from "../ai/budget";
import { getClient, logCost } from "../ai/client";
import { MODELS } from "../ai/models";
import { log } from "../log";
import { GEO_QUESTIONS } from "./questions";

const ENGINE = "claude-web-search";
const MAX_SEARCHES = 3;
const MAX_RESUMES = 3;
// 검색 결과가 입력으로 들어와 토큰이 커진다. 질문 1개 최악 비용을 넉넉히 잡는다
const WORST_CASE_USD_PER_QUESTION = 0.3;

const SYSTEM =
  "Answer the user's question in the same language as the question. Use web search, prefer up-to-date and official sources, and cite the sources you rely on. Keep the answer under 200 words.";

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface Extracted {
  citedUrls: string[];
  searchedUrls: string[];
  text: string;
}

// 답변 본문이 실제로 인용한 URL(citations)과, 검색 결과로만 본 URL 을 나눠 뽑는다
function extract(content: Anthropic.Beta.BetaContentBlock[]): Extracted {
  const cited = new Set<string>();
  const searched = new Set<string>();
  const text: string[] = [];
  for (const block of content) {
    if (block.type === "text") {
      text.push(block.text);
      for (const c of block.citations ?? []) {
        if (c.type === "web_search_result_location") cited.add(c.url);
      }
    } else if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const r of block.content) {
        if (r.type === "web_search_result") searched.add(r.url);
      }
    }
  }
  const answer = text.join("").trim();
  // 답변이 구조화 인용 대신 본문에 링크를 직접 다는 경우가 많다
  for (const url of answer.match(/https?:\/\/[^\s)\]>"'、。]+/g) ?? []) cited.add(url);
  return { citedUrls: [...cited], searchedUrls: [...searched], text: answer };
}

// 인용 도메인: 인용 URL 의 도메인 + 본문에 이름이 언급된 검색 결과 도메인 (예: "出典: Kstyle" → kstyle.com)
function citedDomainsOf(result: Extracted): string[] {
  const domains = new Set(result.citedUrls.map(domainOf));
  const lower = result.text.toLowerCase();
  for (const url of result.searchedUrls) {
    const domain = domainOf(url);
    const name = domain.split(".").slice(0, -1).join(".").replace(/^(jp|en|m)\./, "");
    if (name.length >= 4 && lower.includes(name)) domains.add(domain);
  }
  return [...domains];
}

async function ask(question: string): Promise<Extracted> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: question }];
  const blocks: Anthropic.Beta.BetaContentBlock[] = [];

  for (let i = 0; i <= MAX_RESUMES; i += 1) {
    const response = await getClient().beta.messages.create({
      model: MODELS.geo,
      max_tokens: 4000,
      system: SYSTEM,
      messages,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: MAX_SEARCHES }],
      output_config: { effort: "low" },
    });
    await logCost("geo-check", response.model, response.usage);
    blocks.push(...response.content);
    if (response.stop_reason !== "pause_turn") break;
    // 서버 쪽 검색 루프가 멈춘 경우: 받은 내용을 그대로 돌려보내면 이어서 진행한다
    messages.push({ role: "assistant", content: response.content });
  }
  return extract(blocks);
}

export async function geoCheck(limit: number): Promise<void> {
  const ourDomain = domainOf(process.env.SITE_URL ?? "");
  const questions = GEO_QUESTIONS.slice(0, limit);
  const domainCount = new Map<string, number>();

  for (const { locale, question } of questions) {
    await assertBudget(WORST_CASE_USD_PER_QUESTION);
    const result = await ask(question);
    const citedDomains = citedDomainsOf(result);
    const searchedDomains = [...new Set(result.searchedUrls.map(domainOf))];
    const ourCited = citedDomains.includes(ourDomain);

    await prisma.geoCheck.create({
      data: {
        question,
        locale,
        engine: ENGINE,
        ourCited,
        citedUrls: result.citedUrls,
        citedDomains,
        searchedDomains,
        answerExcerpt: result.text.slice(0, 4000),
      },
    });
    for (const d of citedDomains) domainCount.set(d, (domainCount.get(d) ?? 0) + 1);
    log.info(`geo [${locale}] ${ourCited ? "CITED" : "-"} ${question}`, { cited: citedDomains });
  }

  const top = [...domainCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  log.info("geo: most cited domains", Object.fromEntries(top));
}
