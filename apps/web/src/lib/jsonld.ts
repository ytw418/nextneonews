import { type Locale, SITE_NAME, type UpcomingEvent } from "@kmedia/core";

import { SITE_URL } from "./url";

interface Faq {
  q: string;
  a: string;
}

interface Entity {
  name: string;
  type: string;
  koreanName?: string;
  alternateNames?: string[];
}

export interface ArticleLd {
  url: string;
  locale: string;
  title: string;
  description: string;
  category: string;
  publishedAt: Date | null;
  updatedAt: Date;
  faq: Faq[];
  entities: Entity[];
  sourceUrls: string[];
  homeUrl: string;
  image?: string;
}

const organization = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: `${SITE_URL}/apple-icon` },
};

// 사이트 전체에 한 번: 검색엔진·AI 가 브랜드(조직)와 사이트를 같은 실체로 묶게 한다
export function siteJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: locale,
        publisher: { "@id": organization["@id"] },
      },
    ],
  };
}

// 기사 페이지: NewsArticle + FAQPage + BreadcrumbList
export function articleJsonLd(a: ArticleLd) {
  const graph: Record<string, unknown>[] = [
    {
      "@type": "NewsArticle",
      "@id": `${a.url}#article`,
      headline: a.title,
      description: a.description,
      inLanguage: a.locale,
      url: a.url,
      mainEntityOfPage: a.url,
      datePublished: a.publishedAt?.toISOString(),
      dateModified: a.updatedAt.toISOString(),
      articleSection: a.category,
      ...(a.image ? { image: [a.image] } : {}),
      author: { "@id": organization["@id"] },
      publisher: { "@id": organization["@id"] },
      about: a.entities.map((e) => ({
        "@type": e.type,
        name: e.name,
        alternateName: [e.koreanName, ...(e.alternateNames ?? [])].filter(Boolean),
      })),
      isBasedOn: a.sourceUrls,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: a.homeUrl },
        { "@type": "ListItem", position: 2, name: a.title, item: a.url },
      ],
    },
  ];
  if (a.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: a.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  // 조직(Organization)은 레이아웃의 siteJsonLd 에 이미 있어 @id 로만 참조한다
  return { "@context": "https://schema.org", "@graph": graph };
}

const AVAILABILITY = { onSale: "InStock", soldOut: "SoldOut", presale: "PreOrder", notYet: "PreOrder" } as const;

// 일정 상세: schema.org Event. 컴백·드라마 첫 방송은 장소가 있는 행사가 아니라서 내지 않는다
export function eventJsonLd(e: UpcomingEvent, locale: Locale, url: string) {
  if (e.kind === "comeback" || e.kind === "drama") return null;
  const ticket = e.tickets?.find((t) => t.url);
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.name,
    url,
    inLanguage: locale,
    ...(e.about?.[locale] ? { description: e.about[locale] } : {}),
    startDate: e.startTimeKst ? `${e.start}T${e.startTimeKst}:00+09:00` : e.start,
    // 끝나는 시각은 모르니 날짜만
    endDate: e.end ?? e.start,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: e.watch?.length
      ? "https://schema.org/MixedEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    ...(e.venue
      ? {
          location: {
            "@type": "Place",
            name: e.venue,
            ...(e.city ? { address: { "@type": "PostalAddress", addressLocality: e.city.en } } : {}),
          },
        }
      : {}),
    ...(ticket
      ? {
          offers: {
            "@type": "Offer",
            url: ticket.url,
            availability: `https://schema.org/${AVAILABILITY[ticket.status]}`,
          },
        }
      : {}),
  };
}

// 일정 목록: 상세 페이지 주소를 순서대로
export function scheduleJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, url: item.url })),
  };
}
