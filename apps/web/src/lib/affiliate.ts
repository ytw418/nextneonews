import "server-only";

import type { AffiliatePartner, AffiliateTarget, Region } from "@/data/types";

export type { AffiliatePartner, AffiliateTarget, Region } from "@/data/types";

// 제휴 링크는 여기 한 곳에서 만든다. 카탈로그에는 파트너 사이트의 보통 주소만 두고,
// 사장님이 Vercel 환경변수에 넣은 추적 값으로 바꾼다. 값이 없으면 보통 링크(tagged:false) — 링크는 그래도 살아 있다

export const PARTNER_NAME: Record<AffiliatePartner, string> = {
  oliveyoung: "Olive Young Global",
  yesstyle: "YesStyle",
  amazon: "Amazon",
  klook: "Klook",
  creatrip: "Creatrip",
  trip: "Trip.com",
  airalo: "Airalo",
};

export const PARTNER_ENV: Record<AffiliatePartner, string> = {
  oliveyoung: "AFFILIATE_OLIVEYOUNG",
  yesstyle: "AFFILIATE_YESSTYLE",
  amazon: "AFFILIATE_AMAZON",
  klook: "AFFILIATE_KLOOK",
  creatrip: "AFFILIATE_CREATRIP",
  trip: "AFFILIATE_TRIP",
  airalo: "AFFILIATE_AIRALO",
};

// 모든 제휴 링크의 rel (검색엔진에 광고 링크임을 알리고, 파트너가 유입 출처를 볼 수 있게 noreferrer 는 뺀다)
export const AFFILIATE_REL = "sponsored nofollow noopener";

export interface AffiliateHref {
  href: string;
  tagged: boolean; // 추적 값이 붙었나 (분석 이벤트에 그대로 싣는다)
  partner: AffiliatePartner;
}

// 환경변수 값은 대시보드에서 받은 그대로 붙여 넣는다:
// - {url} 이 있으면 원 주소를 인코딩해 끼운다 (Involve·Awin·Impact 딥링크 템플릿)
// - ? 로 시작하면 원 주소 쿼리에 합친다 (Amazon ?tag=, Creatrip ?utm_source=)
// - 비었거나 모르는 모양이면 원 주소 그대로 (잘못 넣은 값이 깨진 링크가 되지 않게)
export function affiliateHref(target: AffiliateTarget): AffiliateHref {
  const { partner, url } = target;
  const plain = { href: url, tagged: false, partner };
  const value = process.env[PARTNER_ENV[partner]]?.trim();
  if (!value) return plain;
  if (value.includes("{url}")) {
    return { href: value.replaceAll("{url}", encodeURIComponent(url)), tagged: true, partner };
  }
  if (value.startsWith("?")) {
    try {
      const out = new URL(url);
      for (const [key, v] of new URLSearchParams(value.slice(1))) out.searchParams.set(key, v);
      return { href: out.toString(), tagged: true, partner };
    } catch {
      return plain;
    }
  }
  return plain;
}

// 언어별 독자가 사는 곳. 파트너가 지역을 정해 두었으면(regions) 여기와 겹칠 때만 보인다
const LOCALE_REGIONS: Record<string, Region[]> = {
  en: ["us", "sg", "my", "ph"],
  ja: ["jp"],
  "zh-TW": ["tw", "hk"],
  "zh-CN": ["sg", "my"],
  ko: [],
  vi: ["vn"],
  id: ["id"],
  fr: ["fr"],
  ru: [],
};

// 언어별 파트너 순서: 그 언어 독자가 실제로 쓰는 곳이 먼저 (수수료 순이 아니다)
const LOCALE_ORDER: Record<string, AffiliatePartner[]> = {
  en: ["amazon", "yesstyle", "oliveyoung", "klook", "airalo", "trip", "creatrip"],
  ja: ["oliveyoung", "yesstyle", "amazon", "klook", "creatrip", "trip", "airalo"],
  "zh-TW": ["oliveyoung", "yesstyle", "amazon", "klook", "creatrip", "trip", "airalo"],
  "zh-CN": ["oliveyoung", "yesstyle", "amazon", "trip", "klook", "creatrip", "airalo"],
  ko: ["oliveyoung", "yesstyle", "amazon", "klook", "creatrip", "trip", "airalo"],
  vi: ["yesstyle", "oliveyoung", "amazon", "klook", "trip", "airalo", "creatrip"],
  id: ["yesstyle", "oliveyoung", "amazon", "klook", "trip", "airalo", "creatrip"],
  fr: ["yesstyle", "oliveyoung", "amazon", "klook", "airalo", "trip", "creatrip"],
  ru: ["yesstyle", "oliveyoung", "amazon", "trip", "klook", "airalo", "creatrip"],
};

// 이 언어 독자가 살 수 있는 곳인가 (지역 제한이 없거나 global 이거나 독자 지역과 겹치면)
export function regionAllows(locale: string, target: AffiliateTarget): boolean {
  const regions = target.regions;
  if (!regions || regions.length === 0 || regions.includes("global")) return true;
  const mine = LOCALE_REGIONS[locale] ?? LOCALE_REGIONS.en!;
  return regions.some((r) => mine.includes(r));
}

// 언어별 우선순위로 정렬하고 살 수 없는 지역 것은 뺀다 (예: regions 가 us 뿐이면 zh 독자에게는 빠진다)
export function partnersForLocale(locale: string, targets: AffiliateTarget[]): AffiliateTarget[] {
  const order = LOCALE_ORDER[locale] ?? LOCALE_ORDER.en!;
  return targets
    .filter((t) => regionAllows(locale, t))
    .toSorted((a, b) => order.indexOf(a.partner) - order.indexOf(b.partner));
}
