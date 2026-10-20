"use client";

import { useEffect } from "react";

import { type RecentItem, rememberRecent } from "@/lib/recent";
import { storageGet, storageSet } from "@/lib/storage";

const READ_STORE = "hb:read";
const READ_MAX = 200;

// 읽은 글 slug (최근 200개). 다음 글 이어 붙이기가 이미 읽은 글을 건너뛴다 (NextArticleLoader)
export function readSlugs(): string[] {
  try {
    const list: unknown = JSON.parse(storageGet(READ_STORE) ?? "[]");
    return Array.isArray(list) ? list.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function markRead(slug: string) {
  const list = readSlugs().filter((s) => s !== slug);
  list.push(slug);
  storageSet(READ_STORE, JSON.stringify(list.slice(-READ_MAX)));
}

// 조회 수를 한 번 올린다. 같은 탭에서 다시 열거나 새로고침한 것은 세지 않는다.
// 이어 붙인 다음 글도 화면에 들어오면 이것을 부른다 (글마다 한 번)
export function pingView(articleId: string, slug?: string) {
  if (slug) markRead(slug);
  const key = `hb:viewed:${articleId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // 저장소를 못 쓰면 그냥 센다
  }
  const url = `/api/views/${articleId}`;
  if (!navigator.sendBeacon?.(url)) {
    void fetch(url, { method: "POST", keepalive: true }).catch(() => undefined);
  }
}

// 기사를 열면 조회 수를 한 번 올리고 읽은 글로 적는다. recent 가 있으면 홈 '続きから' 목록에도 넣는다
export function ViewPing({
  articleId,
  slug,
  recent,
}: {
  articleId: string;
  slug?: string;
  recent?: Omit<RecentItem, "at">;
}) {
  const recentKey = recent && JSON.stringify(recent);
  useEffect(() => {
    pingView(articleId, slug);
    if (recentKey) rememberRecent(JSON.parse(recentKey) as Omit<RecentItem, "at">);
  }, [articleId, slug, recentKey]);
  return null;
}
