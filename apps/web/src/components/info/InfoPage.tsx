import { type Locale, LOCALE_PATH_PREFIX, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/AppHeader";
import { JsonLd } from "@/components/JsonLd";
import { ListRow } from "@/components/ui/ListRow";
import { Link } from "@/i18n/navigation";
import { localeAlternates, localeHomePath, ogBase, SITE_URL } from "@/lib/url";

import type pagesEn from "../../../messages/ns/Trust/pages/en.json";

// 신뢰 페이지 4개: 애드센스·구글 뉴스 투명성 요건과 커뮤니티 게시중단 창구.
// 푸터·메뉴는 이 목록과 Trust.nav.{key} 이름을 쓴다
export const TRUST_PAGES = [
  { key: "about", path: "/about" },
  { key: "editorial", path: "/editorial-policy" },
  { key: "contact", path: "/contact" },
  { key: "privacy", path: "/privacy" },
] as const;

export type TrustPage = (typeof TRUST_PAGES)[number]["key"];

const pathOf = (page: TrustPage) => TRUST_PAGES.find((p) => p.key === page)!.path;

// 긴 본문은 messages/ns/Trust/pages/{locale}.json 에 따로 둔다. request.ts 가 합치는 Trust/{locale}.json 은
// 레이아웃의 NextIntlClientProvider 가 모든 화면의 클라이언트로 보내서, 거기에는 푸터·메뉴용 짧은 이름만 둔다
export async function trustMessages(locale: Locale): Promise<typeof pagesEn> {
  return (await import(`../../../messages/ns/Trust/pages/${locale}.json`)).default;
}

// 메일 주소는 사장님이 Vercel 환경변수로 넣는다. 없으면 문의 페이지가 '준비 중'이 된다
export function contactEmail(): string | undefined {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL || undefined;
}

const LINK = "font-semibold text-brand-ink underline underline-offset-4";

// 본문 안 앱 링크 (편집 방침·문의 등, 언어가 붙는다). t.rich 의 태그 값으로 쓴다
export function inlineLink(href: string) {
  function InlineLink(chunks: ReactNode) {
    return (
      <Link href={href} className={LINK}>
        {chunks}
      </Link>
    );
  }
  return InlineLink;
}

export function EmailLink({ email }: { email: string }) {
  return (
    <a href={`mailto:${email}`} className={LINK}>
      {email}
    </a>
  );
}

export function infoMetadata(
  locale: Locale,
  page: TrustPage,
  { title, description, noindex }: { title: string; description: string; noindex?: boolean },
): Metadata {
  const alternates = localeAlternates(locale, pathOf(page));
  return {
    // 'About Hallyu Brief | Hallyu Brief' 처럼 사이트 이름이 두 번 붙지 않게
    title: title.includes(SITE_NAME) ? { absolute: title } : title,
    description,
    alternates,
    openGraph: {
      ...ogBase(locale),
      type: "website",
      url: alternates.canonical,
      title,
      description,
      images: [`${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
    // 문의 주소가 아직 없을 때: 빈 페이지가 검색에 잡히지 않게
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

interface Props {
  locale: Locale;
  page: TrustPage;
  schema: "AboutPage" | "ContactPage" | "WebPage";
  title: string;
  description: string;
  lead: ReactNode;
  updated: string; // 'YYYY-MM-DD' 이 페이지 내용을 마지막으로 고친 날 (문구를 바꾸면 같이 올린다)
  updatedLabel: string;
  ld?: Record<string, unknown>; // 페이지 노드에 더할 schema.org 속성 (문의처 등)
  children: ReactNode;
}

// 공통 틀: 상단바(뒤로) → h1 · 한 줄 소개 · 마지막 갱신일 → 섹션들 → 다른 신뢰 페이지 목록
export async function InfoPage({
  locale,
  page,
  schema,
  title,
  description,
  lead,
  updated,
  updatedLabel,
  ld,
  children,
}: Props) {
  const t = await getTranslations("Trust");
  const url = `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}${pathOf(page)}`;
  const organization = { "@id": `${SITE_URL}/#organization` };
  const updatedText = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${updated}T00:00:00Z`),
  );

  return (
    <>
      <AppHeader variant="pushed" parentHref="/" title={title} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": schema,
              "@id": `${url}#webpage`,
              url,
              name: title,
              description,
              inLanguage: locale,
              dateModified: updated,
              isPartOf: { "@id": `${SITE_URL}/#website` },
              publisher: organization,
              ...(schema === "AboutPage" ? { about: organization } : {}),
              breadcrumb: { "@id": `${url}#breadcrumb` },
              ...ld,
            },
            {
              "@type": "BreadcrumbList",
              "@id": `${url}#breadcrumb`,
              itemListElement: [
                { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}${localeHomePath(locale)}` },
                { "@type": "ListItem", position: 2, name: title, item: url },
              ],
            },
          ],
        }}
      />

      <article>
        <header className="px-read pt-6">
          <h1 className="title text-st2 font-bold text-ink-900">{title}</h1>
          <p className="mt-3 text-t5 text-ink-700">{lead}</p>
          <p className="mt-3 text-t7 text-ink-600">
            {updatedLabel} <time dateTime={updated}>{updatedText}</time>
          </p>
        </header>
        {children}
      </article>

      <div aria-hidden className="mt-10 h-4 bg-band" />
      <nav aria-label={t("more")}>
        <ul className="pt-2">
          {TRUST_PAGES.filter((p) => p.key !== page).map((p) => (
            <ListRow key={p.key} href={p.path} inset="read" titleWeight="medium" arrow title={t(`nav.${p.key}`)} />
          ))}
        </ul>
      </nav>
    </>
  );
}

// 섹션: h2(t4 굵게, SectionHeader 와 같은 크기) + 본문. id 는 #bot 처럼 바로 가는 주소가 된다
export function InfoSection({ id, title, children }: { id: string; title: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 px-read pt-10">
      <h2 id={`${id}-title`} className="title text-t4 font-bold text-ink-900">
        {title}
      </h2>
      <div className="mt-3 space-y-4 text-t5 text-ink-700">{children}</div>
    </section>
  );
}

// 점 목록. 항목은 메시지 배열(t.raw) 그대로
export function InfoList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6 marker:text-ink-400">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

// UA·robots.txt 줄처럼 그대로 복사해 쓰는 글자
export function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-btn-m bg-fill-weak px-4 py-3 text-t7 whitespace-pre-wrap break-all text-ink-900">
      <code>{children}</code>
    </pre>
  );
}
