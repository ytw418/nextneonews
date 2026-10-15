import { LOCALE_PATH_PREFIX, LOCALES, SITE_NAME } from "@kmedia/core";

import { listLatest } from "@/lib/articles";
import { articlePath, SITE_URL } from "@/lib/url";

export const revalidate = 3600;

const LOCALE_NAME: Record<(typeof LOCALES)[number], string> = {
  en: "English",
  ja: "日本語",
  "zh-TW": "繁體中文",
  "zh-CN": "简体中文",
  ko: "한국어",
};

// llms.txt: AI 에이전트가 사이트 구조와 최신 글을 한 번에 파악하도록 하는 요약 (https://llmstxt.org)
export async function GET() {
  const latest = await listLatest("en", 30);
  const lines = [
    `# ${SITE_NAME}`,
    "",
    "> Multilingual news and guides about Korean entertainment (K-pop, K-drama), food, travel, working holidays and life in Korea, written for international readers in English, Japanese, Traditional and Simplified Chinese, and Korean. Facts come from official announcements and Korean media, and every article lists its sources.",
    "",
    "## Languages",
    ...LOCALES.map((l) => `- [${LOCALE_NAME[l]}](${SITE_URL}${LOCALE_PATH_PREFIX[l]})`),
    "",
    "## Latest articles (English)",
    ...latest.map((a) => `- [${a.title}](${SITE_URL}${articlePath("en", a.slug)}): ${a.summary}`),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
