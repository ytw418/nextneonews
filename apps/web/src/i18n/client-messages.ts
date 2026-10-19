import type { AbstractIntlMessages } from "next-intl";

// 레이아웃 NextIntlClientProvider 가 클라이언트로 넘기는 메시지. 모든 HTML·RSC 응답에 그대로 실리므로
// 'use client' 컴포넌트(와 그것이 불러오는 모듈)가 실제로 쓰는 것만 고른다. 서버 컴포넌트 문구는 서버가 HTML 로 그려 둔다.
// true = 네임스페이스 전체, 배열 = 그 아래 최상위 키만 (큰 네임스페이스의 서버 전용 설명문·메타 문구를 뺀다).
// 클라이언트 컴포넌트에서 새 네임스페이스·키를 쓰면 여기 더한다 — lib/i18n-client-messages.test.ts 가 빠진 것을 잡는다
export const CLIENT_MESSAGES: Record<string, true | readonly string[]> = {
  Nav: true,
  Engage: true,
  Comments: true,
  Article: true,
  Category: true,
  CategoryGroup: true,
  Schedule: true,
  Install: true,
  Guide: true,
  ErrorPage: true,
  Affiliate: true, // 저장함 구매 칩의 PR 배지·고지
  Rankings: ["tab", "rankLabel", "score", "newEntry", "same", "up", "down", "cheer", "cheered", "cheersToday", "cheerFailed", "cheerTooMany"],
  Feed: ["comments", "reactions", "more", "prev", "next", "pagination"],
  Beauty: ["skinChip", "skinChipMine", "skin", "vote", "quiz"],
  Travel: ["tileStamps", "place", "area"],
  Drama: ["hub", "rating"],
};

function pickKeys(value: AbstractIntlMessages | string, keys: true | readonly string[]): AbstractIntlMessages | string {
  if (keys === true || typeof value === "string") return value;
  return Object.fromEntries(keys.filter((key) => key in value).map((key) => [key, value[key]]));
}

export function pickClientMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  return Object.fromEntries(
    Object.entries(CLIENT_MESSAGES)
      .filter(([ns]) => ns in messages)
      .map(([ns, keys]) => [ns, pickKeys(messages[ns], keys)]),
  );
}
