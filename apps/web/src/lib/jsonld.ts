import { SITE_NAME } from "@kmedia/core";

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
