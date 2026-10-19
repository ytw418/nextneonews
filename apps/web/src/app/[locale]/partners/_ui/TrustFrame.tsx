import { type Locale, LOCALE_PATH_PREFIX, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/AppHeader";
import { JsonLd } from "@/components/JsonLd";
import { ListRow } from "@/components/ui/ListRow";
import { breadcrumbLd, graph } from "@/lib/jsonld-catalog";
import { localeAlternates, localeHomePath, ogBase, pageRobots, SITE_URL } from "@/lib/url";

// 협찬 안내(/partners)·제휴 고지(/disclosure) 공통 틀. 신뢰 페이지(components/info/InfoPage.tsx)와 같은 모양이지만
// 그 틀은 소개·편집 방침·문의·개인정보 4개 주소에 묶여 있어 따로 둔다 (본문 섹션은 InfoSection·InfoList 를 그대로 쓴다)

export type TrustFramePath = "/partners" | "/disclosure";

export function trustFrameMetadata(
  locale: Locale,
  path: TrustFramePath,
  { title, description, index }: { title: string; description: string; index: boolean },
): Metadata {
  const alternates = localeAlternates(locale, path);
  return {
    title: title.includes(SITE_NAME) ? { absolute: title } : title,
    description,
    alternates,
    robots: pageRobots(index),
    openGraph: {
      ...ogBase(locale),
      type: "website",
      url: alternates.canonical,
      title,
      description,
      images: [`${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

interface Props {
  locale: Locale;
  path: TrustFramePath;
  title: string;
  description: string;
  lead: ReactNode;
  updated: string; // 'YYYY-MM-DD' 문구를 마지막으로 고친 날
  updatedLabel: string;
  intro?: ReactNode; // 머리 아래 첫 화면 블록 (숫자·행동 버튼)
  moreLabel: string;
  links: { href: string; title: string }[]; // 맨 아래 '더 보기' 줄
  ld?: object[]; // 페이지·빵부스러기 말고 더할 구조화 데이터 노드 (문의처 등)
  children: ReactNode;
}

// 상단바(뒤로) → h1 · 한 줄 · 갱신일 → (첫 화면 블록) → 섹션들 → 다른 안내 페이지 줄
export function TrustFrame({
  locale,
  path,
  title,
  description,
  lead,
  updated,
  updatedLabel,
  intro,
  moreLabel,
  links,
  ld = [],
  children,
}: Props) {
  const home = `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}`;
  const url = `${home}${path}`;
  const updatedText = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${updated}T00:00:00Z`),
  );

  return (
    <>
      <AppHeader variant="pushed" parentHref="/" title={title} />
      <JsonLd
        data={graph(
          {
            "@type": "WebPage",
            "@id": `${url}#webpage`,
            url,
            name: title,
            description,
            inLanguage: locale,
            dateModified: updated,
            isPartOf: { "@id": `${SITE_URL}/#website` },
            publisher: { "@id": `${SITE_URL}/#organization` },
            breadcrumb: { "@id": `${url}#breadcrumb` },
          },
          {
            ...breadcrumbLd([
              { name: SITE_NAME, url: home },
              { name: title, url },
            ]),
            "@id": `${url}#breadcrumb`,
          },
          ...ld,
        )}
      />

      <article>
        <header className="px-read pt-6">
          <h1 className="title text-st2 font-bold text-ink-900">{title}</h1>
          <p className="mt-3 text-t5 text-ink-700">{lead}</p>
          <p className="mt-3 text-t7 text-ink-600">
            {updatedLabel} <time dateTime={updated}>{updatedText}</time>
          </p>
        </header>
        {intro}
        {children}
      </article>

      <div aria-hidden className="mt-10 h-4 bg-band" />
      <nav aria-label={moreLabel}>
        <ul className="pt-2">
          {links.map((link) => (
            <ListRow key={link.href} href={link.href} inset="read" titleWeight="medium" arrow title={link.title} />
          ))}
        </ul>
      </nav>
    </>
  );
}
