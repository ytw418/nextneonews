import { type Locale, LOCALE_PATH_PREFIX, SITE_NAME, type UpcomingEvent } from "@kmedia/core";

import { SITE_URL } from "./url";

interface Faq {
  q: string;
  a: string;
}

interface Entity {
  id?: string; // 위키데이터 Q-id (있으면 sameAs 로 잇는다)
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
  // 제목·본문을 고친 시각 (contentUpdatedAt ?? publishedAt). 없으면 updatedAt 을 쓴다
  modifiedAt?: Date | null;
  updatedAt?: Date;
  faq: Faq[];
  entities: Entity[];
  sourceUrls: string[];
  sources?: { url: string; publisher: string }[]; // 있으면 citation 에 발행처 이름까지 넣는다
  homeUrl: string;
  image?: string;
  categoryLabel?: string; // 둘 다 있으면 브레드크럼이 홈 › 카테고리 › 글
  categoryUrl?: string;
  aiNotice?: string; // 이 언어의 AI 고지 문장 (backstory). 없으면 영어
  // 음성 비서가 읽을 곳 (예: ["#kp", ".article-summary"]). 화면에 실제로 있는 선택자만 넘긴다 — 없는 선택자는 검사 오류다
  speakable?: string[];
}

// 발행처 로고: 구글은 정사각 112px 이상을 권한다. PWA 설치 아이콘(512px PNG)을 쓴다 (robots.ts 에서 열어 둠)
const LOGO = { "@type": "ImageObject", url: `${SITE_URL}/api/pwa-icon?size=512`, width: 512, height: 512 };

const organization = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: LOGO,
};

// 글쓴이: 사람이 아니라 AI 로 쓰는 편집국이라는 사실 그대로 (소개 페이지가 작성 방식을 설명한다)
const NEWSROOM = { "@type": "Organization", name: `${SITE_NAME} Newsroom`, url: `${SITE_URL}/en/about` };

const AI_NOTICE_EN = "Written and translated with AI from official announcements and Korean media reports.";

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

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// 기사 페이지: NewsArticle + FAQPage + BreadcrumbList.
// author·publisher 는 @id 참조만으로는 이름이 비어 보여서(리치 결과 검사) 인라인으로 쓴다
export function articleJsonLd(a: ArticleLd) {
  const modified = a.modifiedAt ?? a.updatedAt ?? a.publishedAt;
  const sources = a.sources ?? a.sourceUrls.map((url) => ({ url, publisher: hostname(url) }));
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
      dateModified: modified?.toISOString(),
      articleSection: a.categoryLabel ?? a.category,
      ...(a.image ? { image: [a.image] } : {}),
      author: NEWSROOM,
      publisher: organization,
      isAccessibleForFree: true,
      about: a.entities.map((e) => ({
        "@type": e.type,
        name: e.name,
        alternateName: [...new Set([e.koreanName, ...(e.alternateNames ?? [])].filter(Boolean))],
        ...(e.id ? { sameAs: `https://www.wikidata.org/wiki/${e.id}` } : {}),
      })),
      isBasedOn: a.sourceUrls,
      citation: sources.map((s) => ({
        "@type": "CreativeWork",
        url: s.url,
        publisher: { "@type": "Organization", name: s.publisher },
      })),
      backstory: a.aiNotice ?? AI_NOTICE_EN,
      ...(a.speakable?.length ? { speakable: { "@type": "SpeakableSpecification", cssSelector: a.speakable } } : {}),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: a.homeUrl },
        ...(a.categoryLabel && a.categoryUrl
          ? [{ "@type": "ListItem", position: 2, name: a.categoryLabel, item: a.categoryUrl }]
          : []),
        { "@type": "ListItem", position: a.categoryLabel && a.categoryUrl ? 3 : 2, name: a.title, item: a.url },
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
  return { "@context": "https://schema.org", "@graph": graph };
}

const AVAILABILITY = { onSale: "InStock", soldOut: "SoldOut", presale: "PreOrder", notYet: "PreOrder" } as const;

// 공연장 시간대 → 나라·통화 (일정 데이터에 나라가 따로 없다). 모르는 시간대는 비운다
const COUNTRY_BY_TZ: Record<string, { country: string; currency: string }> = {
  "Asia/Seoul": { country: "KR", currency: "KRW" },
  "Asia/Tokyo": { country: "JP", currency: "JPY" },
  "Asia/Taipei": { country: "TW", currency: "TWD" },
  "Asia/Hong_Kong": { country: "HK", currency: "HKD" },
  "Asia/Bangkok": { country: "TH", currency: "THB" },
  "Asia/Ho_Chi_Minh": { country: "VN", currency: "VND" },
  "Asia/Jakarta": { country: "ID", currency: "IDR" },
  "Asia/Manila": { country: "PH", currency: "PHP" },
  "Asia/Singapore": { country: "SG", currency: "SGD" },
};

// 일정 상세: schema.org Event. 컴백·드라마 첫 방송은 장소가 있는 행사가 아니라서 내지 않는다
export function eventJsonLd(e: UpcomingEvent, locale: Locale, url: string) {
  if (e.kind === "comeback" || e.kind === "drama") return null;
  const ticket = e.tickets?.find((t) => t.url);
  const place = COUNTRY_BY_TZ[e.tz ?? "Asia/Seoul"];
  // 출연진: 날짜별 출연 + 날짜 미정 출연 (중복 없이)
  const performers = [...new Set([...(e.days ?? []).flatMap((d) => d.acts), ...(e.lineup ?? [])])];
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.name,
    url,
    inLanguage: locale,
    ...(e.about?.[locale] ? { description: e.about[locale] } : {}),
    // 일정 상세의 공유 이미지와 같은 것
    image: [`${SITE_URL}${LOCALE_PATH_PREFIX[locale]}/opengraph-image`],
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
            ...(e.city || place
              ? {
                  address: {
                    "@type": "PostalAddress",
                    ...(e.city ? { addressLocality: e.city.en } : {}),
                    ...(place ? { addressCountry: place.country } : {}),
                  },
                }
              : {}),
          },
        }
      : {}),
    // 주최(organizer)는 일정 데이터에 없어 비운다 (행사 이름을 주최사로 적으면 틀린 정보가 된다)
    ...(performers.length > 0 ? { performer: performers.map((name) => ({ "@type": "MusicGroup", name })) } : {}),
    ...(ticket
      ? {
          offers: {
            "@type": "Offer",
            url: ticket.url,
            availability: `https://schema.org/${AVAILABILITY[ticket.status]}`,
            ...(place ? { priceCurrency: place.currency } : {}),
            // 접수 시작일 (KST)
            ...(ticket.window ? { validFrom: `${ticket.window.from}T00:00:00+09:00` } : {}),
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
