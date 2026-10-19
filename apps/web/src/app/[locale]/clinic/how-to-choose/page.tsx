import { isLocale, LOCALE_PATH_PREFIX, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createTranslator } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdSlot } from "@/components/AdSlot";
import { AppHeader } from "@/components/AppHeader";
import { longDate } from "@/components/clinic/format";
import { MedicalNotice } from "@/components/clinic/MedicalNotice";
import { clinicPages } from "@/components/clinic/pages";
import { QuestionChecklist } from "@/components/clinic/QuestionChecklist";
import { SourceLinks } from "@/components/clinic/SourceLinks";
import { InfoList, InfoSection } from "@/components/info/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { ShareButton } from "@/components/ShareButton";
import { ListRow } from "@/components/ui/ListRow";
import { koreanLines } from "@/lib/clinic";
import { breadcrumbLd, graph } from "@/lib/jsonld-catalog";
import { guideAlternates, guideRobots } from "@/lib/guide-seo";
import { localeHomePath, ogBase, SITE_URL } from "@/lib/url";

// 문구나 출처를 바꾸면 이 날짜도 올린다
const UPDATED = "2026-10-19";

// 공식 출처 (2026-10-19 확인). 법령 조문은 국가법령정보센터, 등록 명단은 한국보건산업진흥원 메디컬코리아 영문판
const lawUrl = (article: string) => encodeURI(`https://www.law.go.kr/법령/의료법/${article}`);
const SOURCES = {
  hospitals: "https://www.medicalkorea.or.kr/en/registeredhospitals",
  facilitators: "https://www.medicalkorea.or.kr/en/registeredfacilitators",
  act: "https://elaw.klri.re.kr/eng_service/lawViewContent.do?hseq=60070", // 의료해외진출법 영문 (법률 제18622호)
  specialty: lawUrl("제77조"), // 전문의가 아니면 전문과목을 표시하지 못한다
  consent: lawUrl("제24조의2"), // 수술·수혈·전신마취 서면 설명·동의, 사본 발급
  fees: lawUrl("제45조"), // 비급여 고지, 고지한 금액 초과 징수 금지
  records: lawUrl("제21조"), // 본인 기록 열람·사본
  hotline: "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=140632&menuSn=454", // 1330
  kmedi: "https://www.k-medi.or.kr/eng/",
} as const;

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[locale]/clinic/how-to-choose">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator({ locale, messages: await clinicPages(locale), namespace: "howTo" });
  const path = "/clinic/how-to-choose";
  const alternates = guideAlternates(locale, path);
  return {
    title: t("title"),
    description: t("description"),
    alternates,
    robots: guideRobots(locale, path),
    openGraph: {
      ...ogBase(locale),
      type: "article",
      url: alternates.canonical,
      title: t("title"),
      description: t("description"),
      images: [`${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

// 병원 고르는 법: 의료 고지 → 외국인환자 유치 등록 → 의사·전문의 → 서면 견적·동의서 → 통역 → 상담 때 물을 것(한국어로 보여 주기) →
// 문제가 생기면(기록·의료분쟁조정중재원) → 시술 목록 → 광고. 사실마다 공식 출처를 바로 단다
export default async function ClinicHowToPage({ params }: PageProps<"/[locale]/clinic/how-to-choose">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [pages, koPages, enPages, tClinic, tGuide, tArticle] = await Promise.all([
    clinicPages(locale),
    locale === "ko" ? null : clinicPages("ko"),
    clinicPages("en"),
    getTranslations("Clinic"),
    getTranslations("Guide"),
    getTranslations("Article"),
  ]);
  const t = createTranslator({ locale, messages: pages, namespace: "howTo" });
  const questions = pages.howTo.questions;
  const ko = koPages ? koreanLines(questions, koPages.howTo.questions, enPages.howTo.questions) : null;
  const newTab = tClinic("newTab");
  const sourcesLabel = t("sourcesLabel");

  const home = `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}`;
  const url = `${home}/clinic/how-to-choose`;
  const updatedText = longDate(locale, UPDATED);

  return (
    <>
      <AppHeader
        variant="pushed"
        parentHref="/clinic"
        title={t("title")}
        action={<ShareButton title={t("title")} label={tClinic("share")} copiedLabel={tArticle("copied")} />}
      />
      <JsonLd
        data={graph(
          {
            "@type": "WebPage",
            "@id": `${url}#webpage`,
            url,
            name: t("title"),
            description: t("description"),
            inLanguage: locale,
            dateModified: UPDATED,
            isPartOf: { "@id": `${SITE_URL}/#website` },
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
          breadcrumbLd([
            { name: SITE_NAME, url: home },
            { name: tGuide("title"), url: `${home}/guide` },
            { name: tClinic("title"), url: `${home}/clinic` },
            { name: t("title"), url },
          ]),
        )}
      />

      <article>
        <header className="px-read pt-6">
          <h1 className="title text-st2 font-bold text-ink-900">{t("title")}</h1>
          <p className="mt-3 text-t5 text-ink-700">{t("lead")}</p>
          <p className="mt-3 text-t7 text-ink-600">
            {t("updatedLabel")} <time dateTime={UPDATED}>{updatedText}</time>
          </p>
        </header>

        <MedicalNotice locale={locale} withHowTo={false} className="mt-5" />

        <InfoSection id="registered" title={t("registeredTitle")}>
          <p>{t("registered")}</p>
          <p>{t("registeredAgency")}</p>
          <p>{t("registeredCheck")}</p>
          <SourceLinks
            label={sourcesLabel}
            newTab={newTab}
            links={[
              { href: SOURCES.hospitals, text: t("registeredLinks.hospitals") },
              { href: SOURCES.facilitators, text: t("registeredLinks.facilitators") },
              { href: SOURCES.act, text: t("registeredLinks.act") },
            ]}
          />
        </InfoSection>

        <InfoSection id="doctor" title={t("doctorTitle")}>
          <p>{t("doctorSign")}</p>
          <p>{t("doctorAsk")}</p>
          <SourceLinks
            label={sourcesLabel}
            newTab={newTab}
            links={[
              { href: SOURCES.specialty, text: t("doctorLinks.specialty") },
              { href: SOURCES.consent, text: t("doctorLinks.consent") },
            ]}
          />
        </InfoSection>

        <InfoSection id="estimate" title={t("estimateTitle")}>
          <p>{t("estimatePrice")}</p>
          <InfoList items={pages.howTo.estimateItems} />
          <p>{t("estimateConsent")}</p>
          <SourceLinks
            label={sourcesLabel}
            newTab={newTab}
            links={[
              { href: SOURCES.fees, text: t("estimateLinks.fees") },
              { href: SOURCES.consent, text: t("estimateLinks.consent") },
            ]}
          />
        </InfoSection>

        <InfoSection id="interpreter" title={t("interpreterTitle")}>
          <p>{t("interpreter")}</p>
          <p>{t("interpreterHotline")}</p>
          <SourceLinks
            label={sourcesLabel}
            newTab={newTab}
            links={[{ href: SOURCES.hotline, text: t("interpreterLinks.hotline") }]}
          />
        </InfoSection>

        <QuestionChecklist
          id="questions"
          title={t("questionsTitle")}
          hint={t("questionsIntro")}
          items={questions}
          ko={ko}
          showKoreanLabel={tClinic("questions.showKorean")}
          koreanHint={tClinic("questions.koreanHint")}
          inset="read"
          className="pt-10"
        />

        <InfoSection id="dispute" title={t("disputeTitle")}>
          <p>{t("disputeKeep")}</p>
          <p>{t("disputeRecords")}</p>
          <p>{t("disputeAgency")}</p>
          <SourceLinks
            label={sourcesLabel}
            newTab={newTab}
            links={[
              { href: SOURCES.kmedi, text: t("disputeLinks.kmedi") },
              { href: SOURCES.records, text: t("disputeLinks.records") },
            ]}
          />
        </InfoSection>
      </article>

      <div aria-hidden className="mt-10 h-4 bg-band" />
      <nav aria-label={t("moreTitle")}>
        <ul className="pt-2">
          <ListRow href="/clinic" inset="read" title={t("moreTitle")} sub={t("moreLink")} arrow />
        </ul>
      </nav>

      <div className="mt-4 bg-band py-2">
        <AdSlot
          label={tArticle("ad")}
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDE ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE}
        />
      </div>
    </>
  );
}
