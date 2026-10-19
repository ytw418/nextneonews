import { isLocale, LOCALE_PATH_PREFIX, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdSlot } from "@/components/AdSlot";
import { AppHeader } from "@/components/AppHeader";
import { longDate } from "@/components/clinic/format";
import { MedicalNotice } from "@/components/clinic/MedicalNotice";
import { ProcedureRow } from "@/components/clinic/ProcedureRow";
import { CrossRail } from "@/components/guide/CrossRail";
import { Words } from "@/components/guide/Words";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { clinicText, listClinic } from "@/data/clinic";
import { CLINIC_FIELDS } from "@/data/clinic/types";
import { breadcrumbLd, collectionLd, graph, itemListLd } from "@/lib/jsonld-catalog";
import { guideAlternates, guideRobots } from "@/lib/guide-seo";
import { localeHomePath, ogBase, SITE_URL } from "@/lib/url";

// 카탈로그만 읽는 정적 페이지(DB 없음)라 다시 만들지 않는다. 바뀌면 배포가 새로 만든다
export const revalidate = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/clinic">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Clinic" });
  const path = "/clinic";
  const alternates = guideAlternates(locale, path);
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates,
    robots: guideRobots(locale, path),
    openGraph: {
      ...ogBase(locale),
      type: "website",
      url: alternates.canonical,
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [`${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

// 클리닉 허브: 머리 → 의료 고지(고르는 법 링크) → 분야 칩 → 피부·치과·성형 시술 목록(회복·통증 메타) → 광고 → 다른 섹션.
// 의료는 차분하게: 목록(ListRow)으로만, 순위·인기 표시 없이 카탈로그 순서 그대로 둔다
export default async function ClinicHubPage({ params }: PageProps<"/[locale]/clinic">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, tGuide, tArticle, entries, text] = await Promise.all([
    getTranslations("Clinic"),
    getTranslations("Guide"),
    getTranslations("Article"),
    listClinic(locale),
    clinicText(locale),
  ]);
  const home = `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}`;
  const pageUrl = `${home}/clinic`;
  const checked = entries.reduce((latest, e) => (e.addedAt > latest ? e.addedAt : latest), "");
  const checkedText = checked ? longDate(locale, checked) : null;
  const fields = CLINIC_FIELDS.map((field) => ({ field, items: entries.filter((e) => e.field === field) })).filter(
    (f) => f.items.length > 0,
  );

  return (
    <>
      <AppHeader title={t("title")} />
      <JsonLd
        data={graph(
          collectionLd({
            pageUrl,
            name: t("metaTitle"),
            description: t("metaDescription"),
            locale,
            parts: fields.map(({ field }) => ({ name: text.fields[field].name, url: `${pageUrl}#${field}` })),
          }),
          itemListLd({
            pageUrl,
            name: t("title"),
            items: entries.map((e) => ({ name: e.text.name, url: `${pageUrl}/${e.slug}` })),
          }),
          breadcrumbLd([
            { name: SITE_NAME, url: home },
            { name: tGuide("title"), url: `${home}/guide` },
            { name: t("title"), url: pageUrl },
          ]),
        )}
      />

      <div className="px-gutter pt-6">
        <h1 className="text-st2 font-bold text-ink-900">{t("title")}</h1>
        <p className="mt-1 text-t6 text-ink-600">
          <Words text={t("intro")} locale={locale} />
        </p>
        {checkedText && (
          <p className="mt-1 text-st12 tabular-nums text-ink-600">
            <time dateTime={checked}>{t("checked", { date: checkedText })}</time>
          </p>
        )}
      </div>

      <MedicalNotice locale={locale} className="mt-4" />

      <nav aria-label={t("fieldsNav")} className="rail mt-4 gap-2 px-gutter py-1">
        {fields.map(({ field }) => (
          <a
            key={field}
            href={`#${field}`}
            className="press hit inline-flex min-h-9 items-center rounded-full bg-card px-3.5 text-t6 font-semibold text-ink-700 shadow-card"
          >
            {text.fields[field].name}
          </a>
        ))}
      </nav>

      {fields.map(({ field, items }) => (
        <section key={field} id={field} aria-labelledby={`clinic-${field}`} className="scroll-mt-16">
          <div aria-hidden className="mt-6 h-4 bg-band" />
          <SectionHeader id={`clinic-${field}`} title={text.fields[field].name} count={items.length} />
          <p className="-mt-1 px-gutter pb-1 text-t6 text-ink-600">
            <Words text={text.fields[field].intro} locale={locale} />
          </p>
          <ul>
            {items.map((entry) => (
              <ProcedureRow key={entry.slug} entry={entry} locale={locale} />
            ))}
          </ul>
        </section>
      ))}

      <div className="mt-6 bg-band py-2">
        <AdSlot
          label={tArticle("ad")}
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDE ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE}
        />
      </div>
      <CrossRail from="clinic" locale={locale} />
    </>
  );
}
