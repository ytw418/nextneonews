import { createHmac } from "node:crypto";

import type { Locale } from "./locales";

const ANON_NAME: Record<Locale, string> = {
  ko: "ㅇㅇ",
  ja: "名無しさん",
  "zh-TW": "匿名",
  "zh-CN": "匿名",
  en: "Anon",
  vi: "Ẩn danh",
  id: "Anonim",
  fr: "Anonyme",
  ru: "Аноним",
};

// 디시처럼 "ㅇㅇ(7f3a)" 형태로 보이되, 괄호 안은 IP가 아니라 IP 해시다.
// 글 ID를 섞어서 같은 글 안에서만 같은 사람끼리 구분되고, 다른 글로는 추적되지 않는다.
export function anonymousId(ip: string, articleId: string, secret: string): string {
  return createHmac("sha256", secret).update(`${articleId}:${ip}`).digest("hex").slice(0, 4);
}

export function displayNickname(
  input: { nickname?: string | null; ip: string; articleId: string; locale: Locale },
  secret: string,
): string {
  const name = input.nickname?.trim() || ANON_NAME[input.locale];
  return `${name}(${anonymousId(input.ip, input.articleId, secret)})`;
}
