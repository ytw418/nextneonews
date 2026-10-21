import { LOCALE_PATH_PREFIX, LOCALES, type Locale } from "./locales";

// 웹뷰가 어떤 주소로 가려 할 때 앱이 무엇을 할지. 순수 함수 (루트 vitest 가 돈다).
// RN 의 URL 은 host·pathname 을 다 구현하지 않아 정규식으로 나눈다

export type Tab = "home" | "rankings" | "guide" | "schedule" | "saved";
export const TABS: readonly Tab[] = ["home", "rankings", "guide", "schedule", "saved"];

// 웹 TabBar(apps/web/src/components/TabBar.tsx)와 같은 다섯 탭의 첫 화면
const TAB_PATH: Record<Tab, string> = { home: "/", rankings: "/rankings", guide: "/guide", schedule: "/schedule", saved: "/saved" };

const PREFIX_LOCALE = new Map<string, Locale>(LOCALES.map((l) => [LOCALE_PATH_PREFIX[l].slice(1), l]));

export function splitUrl(url: string): { scheme: string; host: string; path: string } | null {
  const m = /^([a-z][a-z0-9+.-]*):(?:\/\/([^/?#]*))?([^?#]*)/i.exec(url);
  if (!m) return null;
  return { scheme: m[1].toLowerCase(), host: (m[2] ?? "").toLowerCase(), path: m[3] || "/" };
}

// "/zh-tw/news/x" → "zh-TW". 언어가 없는 경로는 null
export function localeFromPath(path: string): Locale | null {
  return PREFIX_LOCALE.get((path.split("/")[1] ?? "").toLowerCase()) ?? null;
}

export function stripLocale(path: string): string {
  return localeFromPath(path) ? path.replace(/^\/[^/]+/, "") || "/" : path;
}

// 다섯 탭의 첫 화면이면 그 탭 (그 아래 화면은 null — 지금 웹뷰 안에서 연다)
export function tabForPath(path: string): Tab | null {
  const p = stripLocale(path).replace(/\/+$/, "") || "/";
  return TABS.find((t) => TAB_PATH[t] === p) ?? null;
}

export function tabRootPath(tab: Tab): string {
  return TAB_PATH[tab];
}

// 사이트 주소 + 언어 + 경로 ("/" 는 언어 홈)
export function pageUrl(site: string, locale: Locale, path: string): string {
  return `${site}${LOCALE_PATH_PREFIX[locale]}${path === "/" ? "" : path}`;
}

export type LinkKind = { kind: "tab"; tab: Tab } | { kind: "internal" } | { kind: "external" } | { kind: "system" } | { kind: "blocked" };

const SYSTEM_SCHEMES = new Set(["mailto", "tel", "sms"]);
const OUTSIDE_APP_PATH = /^\/clinic(\/|$)/;

// tab: 다섯 탭 첫 화면 → 네이티브 탭으로 / internal: 지금 웹뷰에서 / external: 사이트 밖 → 인앱 사파리 창 /
// system: mailto·tel·sms, 일정 .ics·RSS → 시스템에 넘긴다 / blocked: 그 밖의 스킴(javascript:·data:·file:·다른 앱 딥링크)은 열지 않는다.
// 시술 가이드(/clinic)는 앱 1판에서 뺐다(Apple 1.4.1) — 사이트 주소여도 사파리 창으로 연다
export function classifyUrl(url: string, siteHosts: readonly string[]): LinkKind {
  if (/^(about|blob):/i.test(url)) return { kind: "internal" }; // iframe·빈 창
  const u = splitUrl(url);
  if (!u) return { kind: "blocked" };
  if (u.scheme !== "http" && u.scheme !== "https") return SYSTEM_SCHEMES.has(u.scheme) ? { kind: "system" } : { kind: "blocked" };
  if (!siteHosts.includes(u.host)) return { kind: "external" };
  if (/\.(ics|xml)$/i.test(u.path) || u.path.startsWith("/api/calendar/")) return { kind: "system" };
  if (OUTSIDE_APP_PATH.test(stripLocale(u.path))) return { kind: "external" };
  const tab = tabForPath(u.path);
  return tab ? { kind: "tab", tab } : { kind: "internal" };
}
