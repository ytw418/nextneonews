import { isLocale, type Locale, LOCALE_PATH_PREFIX, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";

import { AdSlot } from "@/components/AdSlot";
import { AppHeader } from "@/components/AppHeader";
import { ClinicSection, DotList } from "@/components/clinic/ClinicSection";
import { FactTable } from "@/components/clinic/FactTable";
import { longDate, painPhrase, recoveryPhrase, shortUrl } from "@/components/clinic/format";
import { MedicalNotice } from "@/components/clinic/MedicalNotice";
import { PriceCard } from "@/components/clinic/PriceCard";
import { ProcedureRow } from "@/components/clinic/ProcedureRow";
import { QuestionChecklist } from "@/components/clinic/QuestionChecklist";
import { CrossRail } from "@/components/guide/CrossRail";
import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { ExternalIcon } from "@/components/icons";
import { VoteChips } from "@/components/ItemVote";
import { JsonLd } from "@/components/JsonLd";
import { SaveButton } from "@/components/SaveButton";
import { ShareButton } from "@/components/ShareButton";
import { Badge } from "@/components/ui/Badge";
import { keepDots } from "@/components/ui/Meta";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { clinicSlugs, clinicText, getClinic, listClinic } from "@/data/clinic";
import { SECTION_TINT } from "@/data/sections";
import { Link } from "@/i18n/navigation";
import { coverGlyph, koreanLines } from "@/lib/clinic";
import { emptyTotals, getItemTotals } from "@/lib/item-votes";
import { breadcrumbLd, faqLd, graph } from "@/lib/jsonld-catalog";
import { guideAlternates, guideRobots } from "@/lib/guide-seo";
import { localeHomePath, ogBase, SITE_URL } from "@/lib/url";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return clinicSlugs().map((slug) => ({ slug }));
}

const VOTE_CHOICES = ["curious", "done", "pass"] as const;
// 이름 아래 다른 이름은 세 개까지 (보톡스처럼 제품명이 줄줄이 붙으면 첫 화면을 다 먹는다)
const AKA_SHOWN = 3;

// 메타데이터와 본문이 같은 요청에서 한 번만 읽는다
const loadProcedure = cache(async (locale: Locale, slug: string) => getClinic(slug, locale));

export async function generateMetadata({ params }: PageProps<"/[locale]/clinic/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const entry = await loadProcedure(locale, slug);
  if (!entry) return {};
  const t = await getTranslations({ locale, namespace: "Clinic" });
  const name = entry.text.name;
  const title = t("detailMetaTitle", { name });
  const description = t("detailMetaDescription", {
    name,
    recovery: recoveryPhrase(t, entry.downtimeDays),
    pain: painPhrase(t, entry.painLevel),
  });
  const path = `/clinic/${slug}`;
  const alternates = guideAlternates(locale, path);
  return {
    title,
    description,
    alternates,
    // 색인 제외 언어와 치과·성형(변호사 검토 전)은 noindex, follow — 판정은 lib/guide-seo.ts 한 곳
    robots: guideRobots(locale, path),
    openGraph: {
      ...ogBase(locale),
      type: "article",
      url: alternates.canonical,
      title,
      description,
      images: [`${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

// 시술 한 개 (DESIGN §5: 히어로 커버 없이 사실 표부터). 위에서부터:
// 이름·분야 → 의료 고지 → 사실 표 → 무엇·누구·과정 → 가격(또는 싣지 않는 이유) → 회복 → 위험·부작용 →
// 관심 투표 → 병원에 물어볼 질문(한국어로 보여 주기) → 관리 → 자주 묻는 질문 → 출처·기준일 → 의료 고지 →
// 광고(투표와 한 화면 이상 떨어짐) → 같은 분야 다른 시술 → 다른 섹션. 병원명·전후 사진·후기·제휴 상자는 없다
export default async function ClinicProcedurePage({ params }: PageProps<"/[locale]/clinic/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const entry = await loadProcedure(locale, slug);
  if (!entry) notFound();

  const [t, tGuide, tArticle, text, all, votes, koText, enText] = await Promise.all([
    getTranslations("Clinic"),
    getTranslations("Guide"),
    getTranslations("Article"),
    clinicText(locale),
    listClinic(locale),
    getItemTotals("clinic", [slug]),
    locale === "ko" ? null : clinicText("ko"),
    clinicText("en"),
  ]);
  const { text: copy } = entry;
  const fieldName = text.fields[entry.field].name;
  const related = all.filter((e) => e.field === entry.field && e.slug !== slug);
  const ko = koText
    ? koreanLines(copy.questionsToAsk, koText.procedures[slug]?.questionsToAsk, enText.procedures[slug]?.questionsToAsk ?? [])
    : null;
  const home = `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}`;
  const pageUrl = `${home}/clinic/${slug}`;
  const checked = longDate(locale, entry.addedAt);

  return (
    <>
      <AppHeader
        variant="pushed"
        parentHref="/clinic"
        title={copy.name}
        action={
          <>
            <SaveButton kind="clinic" id={slug} title={copy.name} />
            <ShareButton title={copy.name} label={t("share")} copiedLabel={tArticle("copied")} />
          </>
        }
      />
      <JsonLd
        data={graph(
          faqLd(copy.faq),
          breadcrumbLd([
            { name: SITE_NAME, url: home },
            { name: tGuide("title"), url: `${home}/guide` },
            { name: t("title"), url: `${home}/clinic` },
            { name: copy.name, url: pageUrl },
          ]),
        )}
      />

      <header className="flex items-start gap-4 px-gutter pt-5">
        <TypeCover
          tint={SECTION_TINT.clinic}
          glyph={coverGlyph(entry)}
          variant="square"
          className="size-16 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <Link href={`/clinic#${entry.field}`} className="hit inline-flex">
            <Badge tone="tint" tint={SECTION_TINT.clinic}>
              {fieldName}
            </Badge>
          </Link>
          <h1 className="mt-1.5 text-t3 font-bold text-ink-900">
            <Words text={copy.name} locale={locale} />
          </h1>
          {copy.aka.length > 0 && (
            <p className="mt-1 text-t7 text-ink-600">{keepDots(copy.aka.slice(0, AKA_SHOWN).join(" · "))}</p>
          )}
        </div>
      </header>

      <MedicalNotice locale={locale} className="mt-4" />
      <FactTable procedure={entry} locale={locale} />

      <ClinicSection id="what" title={t("sections.what")}>
        <p>{copy.what}</p>
      </ClinicSection>
      <ClinicSection id="who" title={t("sections.whoFor")}>
        <p>{copy.whoFor}</p>
      </ClinicSection>
      {copy.steps && (
        <ClinicSection id="steps" title={t("sections.steps")}>
          <p>{copy.steps}</p>
        </ClinicSection>
      )}

      <PriceCard price={entry.price} locale={locale} />

      <ClinicSection id="recovery" title={t("sections.recovery")}>
        <p>{copy.recovery}</p>
      </ClinicSection>
      <ClinicSection id="risks" title={t("sections.risks")}>
        <DotList items={copy.risks} />
      </ClinicSection>

      <VoteChips
        kind="clinic"
        itemId={slug}
        initial={votes.get(slug) ?? emptyTotals("clinic")}
        choices={VOTE_CHOICES.map((key) => ({ key, label: t(`vote.${key}`) }))}
        question={t("vote.question")}
        note={t("vote.note")}
        className="mx-gutter mt-8"
      />

      <QuestionChecklist
        id="questions"
        title={t("questions.title")}
        hint={t("questions.hint")}
        items={copy.questionsToAsk}
        ko={ko}
        showKoreanLabel={t("questions.showKorean")}
        koreanHint={t("questions.koreanHint")}
        className="pt-8"
      />

      <ClinicSection id="aftercare" title={t("sections.aftercare")}>
        <DotList items={copy.aftercare} />
      </ClinicSection>

      <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 px-gutter pt-8">
        <h2 id="faq-title" className="text-t4 font-bold text-ink-900">
          {t("sections.faq")}
        </h2>
        <div className="mt-1 divide-y divide-line">
          {copy.faq.map(({ q, a }) => (
            <div key={q} className="py-4">
              <h3 className="text-t5 font-bold text-ink-900">{q}</h3>
              <p className="mt-1.5 text-t6 text-ink-700">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="sources" aria-labelledby="sources-title" className="scroll-mt-16 px-gutter pt-6">
        <h2 id="sources-title" className="text-t4 font-bold text-ink-900">
          {t("sections.sources")}
        </h2>
        <p className="mt-1 text-t6 text-ink-600">{t("sections.sourcesIntro")}</p>
        <ol className="mt-2">
          {entry.sources.map((url) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-1.5 py-1 text-t7 text-ink-700 underline underline-offset-4 [overflow-wrap:anywhere]"
              >
                <span className="min-w-0">{shortUrl(url)}</span>
                <ExternalIcon className="size-3.5 shrink-0 text-ink-400" />
                <span className="sr-only">{t("newTab")}</span>
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-st12 tabular-nums text-ink-600">
          <time dateTime={entry.addedAt}>{t("checked", { date: checked })}</time>
        </p>
      </section>

      <MedicalNotice locale={locale} repeat className="mt-8" />

      <div className="mt-6 bg-band py-2">
        <AdSlot
          label={tArticle("ad")}
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDE ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE}
        />
      </div>

      {related.length > 0 && (
        <section aria-labelledby="clinic-related">
          <SectionHeader
            id="clinic-related"
            title={t("sections.other", { field: fieldName })}
            href={`/clinic#${entry.field}`}
            linkLabel={t("seeAll")}
          />
          <ul>
            {related.map((e) => (
              <ProcedureRow key={e.slug} entry={e} locale={locale} />
            ))}
          </ul>
        </section>
      )}
      <CrossRail from="clinic" locale={locale} exclude={slug} />
    </>
  );
}
