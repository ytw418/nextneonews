import { createHmac } from "node:crypto";

import { friendlyNameFromHash } from "./comments";
import type { Locale } from "./locales";

// IP 대신 IP 해시 4자리. 아바타 색을 고르고, 이름 없이 쓴 사람의 이름("다정한수달")도 여기서 정한다.
// 글 ID를 섞어서 같은 글 안에서만 같은 사람끼리 구분되고, 다른 글로는 추적되지 않는다.
export function anonymousId(ip: string, articleId: string, secret: string): string {
  return createHmac("sha256", secret).update(`${articleId}:${ip}`).digest("hex").slice(0, 4);
}

// 이름만 보여 준다 (예전 "ㅇㅇ(7f3a)" 꼬리는 없앴다. 사람 구분은 아바타 색이 한다)
export function displayNickname(
  input: { nickname?: string | null; ip: string; articleId: string; locale: Locale },
  secret: string,
): string {
  return input.nickname?.trim() || friendlyNameFromHash(input.locale, anonymousId(input.ip, input.articleId, secret));
}
