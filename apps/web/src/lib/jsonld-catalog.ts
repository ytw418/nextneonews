import { SITE_URL } from "./url";
import { MIN_VOTES_FOR_SUMMARY } from "./vote-rules";

// 가이드 섹션(뷰티·여행·클리닉·드라마) 구조화 데이터 빌더. 화면에 보이는 것만 넣는다 (보이지 않는 별점·후기 금지).
// 조직·사이트는 레이아웃의 siteJsonLd 에 있어 @id 로만 가리킨다. 여러 노드는 graph() 로 한 스크립트에 묶는다
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export interface Crumb {
  name: string;
  url: string;
}

export function breadcrumbLd(crumbs: Crumb[]): object {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
  };
}

// 목록 페이지 (어워드·동네·드라마 목록). type 을 주면 항목을 그 타입으로 감싼다 (Product·TouristAttraction 등)
export function itemListLd(i: {
  pageUrl: string;
  name: string;
  items: { name: string; url: string; type?: string }[];
}): object {
  return {
    "@type": "ItemList",
    "@id": `${i.pageUrl}#list`,
    name: i.name,
    numberOfItems: i.items.length,
    itemListElement: i.items.map((item, index) =>
      item.type
        ? { "@type": "ListItem", position: index + 1, item: { "@type": item.type, name: item.name, url: item.url } }
        : { "@type": "ListItem", position: index + 1, name: item.name, url: item.url },
    ),
  };
}

// 제품. 별점(5점 만점으로 환산한 값)은 실제 표가 MIN_VOTES_FOR_SUMMARY 이상일 때만 (그보다 적으면 넘기지 않는다 — 여기서도 한 번 더 막는다)
export function productLd(i: {
  url: string;
  name: string;
  brand: string;
  description: string;
  category?: string;
  image?: string; // 오려 낸 제품 CC 사진 (절대 주소). 없으면 뺀다 — 아이콘은 제품 사진이 아니다
  rating?: { value: number; count: number } | null;
}): object {
  return {
    "@type": "Product",
    "@id": `${i.url}#product`,
    url: i.url,
    name: i.name,
    brand: { "@type": "Brand", name: i.brand },
    description: i.description,
    ...(i.category ? { category: i.category } : {}),
    ...(i.image ? { image: i.image } : {}),
    ...(i.rating && i.rating.count >= MIN_VOTES_FOR_SUMMARY
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(i.rating.value.toFixed(2)),
            ratingCount: i.rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

// 명소 (관광지)
export function placeLd(i: {
  url: string;
  name: string;
  description: string;
  address?: string;
  geo?: { lat: number; lng: number };
  sameAs?: string[];
}): object {
  return {
    "@type": "TouristAttraction",
    "@id": `${i.url}#place`,
    url: i.url,
    name: i.name,
    description: i.description,
    ...(i.address ? { address: i.address } : {}),
    ...(i.geo ? { geo: { "@type": "GeoCoordinates", latitude: i.geo.lat, longitude: i.geo.lng } } : {}),
    ...(i.sameAs?.length ? { sameAs: i.sameAs } : {}),
  };
}

export function faqLd(faq: { q: string; a: string }[]): object {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function tvSeriesLd(i: {
  url: string;
  name: string;
  alternateName?: string[];
  description: string;
  startDate?: string;
  numberOfEpisodes?: number;
  actors?: { name: string; url?: string }[];
  sameAs?: string[];
}): object {
  return {
    "@type": "TVSeries",
    "@id": `${i.url}#series`,
    url: i.url,
    name: i.name,
    ...(i.alternateName?.length ? { alternateName: i.alternateName } : {}),
    description: i.description,
    ...(i.startDate ? { startDate: i.startDate } : {}),
    ...(i.numberOfEpisodes ? { numberOfEpisodes: i.numberOfEpisodes } : {}),
    ...(i.actors?.length
      ? { actor: i.actors.map((a) => ({ "@type": "Person", name: a.name, ...(a.url ? { url: a.url } : {}) })) }
      : {}),
    ...(i.sameAs?.length ? { sameAs: i.sameAs } : {}),
  };
}

// 허브 페이지: CollectionPage 가 섹션(하위 허브)들을 hasPart 로 가진다
export function collectionLd(i: {
  pageUrl: string;
  name: string;
  description: string;
  locale: string;
  parts: { name: string; url: string }[];
}): object {
  return {
    "@type": "CollectionPage",
    "@id": `${i.pageUrl}#page`,
    url: i.pageUrl,
    name: i.name,
    description: i.description,
    inLanguage: i.locale,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    hasPart: i.parts.map((p) => ({ "@type": "CollectionPage", name: p.name, url: p.url })),
  };
}

export function graph(...nodes: object[]): object {
  return { "@context": "https://schema.org", "@graph": nodes };
}
