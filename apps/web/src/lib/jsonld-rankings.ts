import type { RankingItem } from "@kmedia/core";

import { isWeekPeriod, type RankEntity, type Snapshot, weekStart } from "./rankings";
import { SITE_URL } from "./url";

// 랭킹 구조화 데이터. 화면과 같은 스냅숏 객체에서 만든다 — 화면 순위와 JSON-LD 순위가 어긋나지 않게.
// 조직(Organization)·사이트(WebSite)는 레이아웃의 siteJsonLd 에 있어 @id 로만 가리킨다
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const SCHEMA_TYPE: Record<string, string> = {
  group: "MusicGroup",
  singer: "Person",
  actor: "Person",
  series: "TVSeries",
};

interface Crumb {
  name: string;
  url: string;
}

function breadcrumbs(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
  };
}

export interface ChartLdInput {
  snapshot: Snapshot;
  entities: Map<string, RankEntity>;
  locale: string;
  name: string; // 차트 이름 (화면 h1)
  description: string; // 데이터셋 설명 (50자 이상)
  pageUrl: string; // 이 페이지 (주간판이면 주간판 주소)
  chartUrl: string; // 최신 차트 주소 (데이터셋 대표 주소)
  methodologyUrl: string;
  firstPeriod: string | null;
  today: string; // KST 'YYYY-MM-DD'
  crumbs: Crumb[]; // 홈 › 랭킹 › 차트 (› 주)
  nameOf: (item: RankingItem) => string;
  idolUrl: (slug: string) => string;
}

// 차트 페이지: ItemList(순위) + Dataset(공개 데이터) + BreadcrumbList
export function chartJsonLd(input: ChartLdInput) {
  const { snapshot, entities } = input;
  const chart = snapshot.chart;
  const api = `${SITE_URL}/api/rankings/${chart}/history?days=90&top=30`;
  const start = input.firstPeriod ?? snapshot.period;

  const list = {
    "@type": "ItemList",
    "@id": `${input.pageUrl}#list`,
    name: input.name,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: snapshot.items.length,
    itemListElement: snapshot.items.map((item) => {
      const entity = entities.get(item.entityId);
      const alternate = [item.names.ko].filter((n): n is string => !!n && n !== input.nameOf(item));
      return {
        "@type": "ListItem",
        position: item.rank,
        item: {
          "@type": SCHEMA_TYPE[entity?.type ?? ""] ?? "Thing",
          name: input.nameOf(item),
          ...(alternate.length > 0 ? { alternateName: alternate } : {}),
          url: entity?.slug ? input.idolUrl(entity.slug) : `${input.chartUrl}#r-${item.entityId}`,
          ...(entity?.photo ? { image: entity.photo.src } : {}),
          sameAs: `https://www.wikidata.org/wiki/${item.entityId}`,
        },
      };
    }),
  };

  const dataset = {
    "@type": "Dataset",
    "@id": `${input.chartUrl}#dataset`,
    name: input.name,
    description: input.description,
    url: input.chartUrl,
    inLanguage: input.locale,
    creator: { "@id": ORGANIZATION_ID },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    temporalCoverage: `${isWeekPeriod(start) ? weekStart(start) : start}/${input.today}`,
    variableMeasured: ["buzz score", "Korea buzz", "global interest"],
    measurementTechnique: input.methodologyUrl,
    isBasedOn: snapshot.sources.map((s) => s.url).filter(Boolean),
    dateModified: snapshot.publishedAt.toISOString(),
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: api },
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${api}&format=csv` },
    ],
  };

  return { "@context": "https://schema.org", "@graph": [list, dataset, breadcrumbs(input.crumbs)] };
}

export interface IdolLdInput {
  type: string; // Entity.type
  name: string; // 화면 h1 (그 언어 이름)
  alternateNames: (string | null)[]; // 한국어·영어·일본어·번체 이름
  image: string | null;
  pageUrl: string;
  sameAs: string[]; // 위키데이터 + 위키백과 문서
  crumbs: Crumb[]; // 홈 › 랭킹 › 차트 › 이름
}

// 인물·작품 페이지: MusicGroup | Person | TVSeries 하나 + BreadcrumbList.
// 그룹 멤버(member)는 인물 사전에 멤버 관계가 생기면 넣는다 (지금은 데이터가 없어 넣지 않는다)
export function idolJsonLd(input: IdolLdInput) {
  const alternateName = [...new Set(input.alternateNames.filter((n): n is string => !!n && n !== input.name))];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": SCHEMA_TYPE[input.type] ?? "Thing",
        "@id": `${input.pageUrl}#entity`,
        name: input.name,
        ...(alternateName.length > 0 ? { alternateName } : {}),
        ...(input.image ? { image: input.image } : {}),
        url: input.pageUrl,
        sameAs: input.sameAs,
      },
      breadcrumbs(input.crumbs),
    ],
  };
}

// 랭킹 허브: 차트 목록을 담은 CollectionPage
export function hubJsonLd(input: {
  locale: string;
  name: string;
  description: string;
  pageUrl: string;
  charts: { name: string; url: string }[];
  crumbs: Crumb[];
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": input.pageUrl,
        url: input.pageUrl,
        name: input.name,
        description: input.description,
        inLanguage: input.locale,
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORGANIZATION_ID },
        hasPart: input.charts.map((c) => ({ "@type": "WebPage", name: c.name, url: c.url })),
      },
      breadcrumbs(input.crumbs),
    ],
  };
}
