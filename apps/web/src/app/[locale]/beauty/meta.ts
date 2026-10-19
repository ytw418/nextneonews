import { LOCALE_PATH_PREFIX, type Locale, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";

import { guideAlternates, guideRobots } from "@/lib/guide-seo";
import type { Crumb } from "@/lib/jsonld-catalog";
import { localeHomePath, ogBase, SITE_URL } from "@/lib/url";

// 뷰티 화면 공용 메타 (rankings/page.tsx 와 같은 모양): canonical·hreflang·og. ogImage=false 면 그 경로의 opengraph-image 파일이 쓰인다.
// hreflang·robots 는 가이드 색인 정책(lib/guide-seo.ts)을 따른다 — 색인 언어끼리만 잇고, 그 밖의 언어는 noindex, follow
export function beautyMetadata(i: {
  locale: string;
  path: string; // 언어 접두사 뺀 경로 (/beauty/p/x)
  title: string;
  description: string;
  ogImage?: boolean;
}): Metadata {
  const alternates = guideAlternates(i.locale, i.path);
  return {
    title: i.title,
    description: i.description,
    alternates,
    robots: guideRobots(i.locale, i.path),
    openGraph: {
      ...ogBase(i.locale),
      type: "website",
      url: alternates.canonical,
      title: i.title,
      description: i.description,
      ...(i.ogImage === false ? {} : { images: [`${localeHomePath(i.locale)}/opengraph-image`] }),
    },
    twitter: { card: "summary_large_image" },
  };
}

export function absoluteUrl(locale: Locale, path: string): string {
  return `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}${path}`;
}

// 사이트 → 가이드 → 뷰티 → … (화면의 Crumbs 와 같은 단계)
export function beautyCrumbs(locale: Locale, guide: string, beauty: string, rest: Crumb[] = []): Crumb[] {
  return [
    { name: SITE_NAME, url: absoluteUrl(locale, "") },
    { name: guide, url: absoluteUrl(locale, "/guide") },
    { name: beauty, url: absoluteUrl(locale, "/beauty") },
    ...rest,
  ];
}

// 테스트·결과 화면 (jsonld-catalog 에 WebPage 빌더가 없어 여기 둔다 — 다른 섹션도 쓰면 공용으로 옮길 후보)
export function webPageLd(i: { url: string; name: string; description: string; locale: string }): object {
  return {
    "@type": "WebPage",
    "@id": `${i.url}#page`,
    url: i.url,
    name: i.name,
    description: i.description,
    inLanguage: i.locale,
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}
