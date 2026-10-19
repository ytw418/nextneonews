import { isLocale, type Locale, LOCALE_NAME, LOCALES } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createTranslator } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { Words } from "@/components/guide/Words";
import { CheckIcon } from "@/components/icons";
import { contactEmail, EmailLink, InfoList, InfoSection, inlineLink } from "@/components/info/InfoPage";
import { Button } from "@/components/ui/Button";
import { SITE_URL } from "@/lib/url";

import type pagesEn from "../../../../messages/ns/Partners/pages/en.json";
import { TrustFrame, trustFrameMetadata } from "./_ui/TrustFrame";

// 문구를 바꾸면 이 날짜도 올린다
const UPDATED = "2026-10-19";

export const revalidate = 3600;

interface Package {
  name: string;
  line: string;
  includes: string[];
}

// 긴 본문은 provider 밖 pages 파일에 둔다 (Trust/pages 와 같은 방식 — 모든 화면의 클라이언트로 보내지 않는다)
async function partnersMessages(locale: Locale): Promise<typeof pagesEn> {
  return (await import(`../../../../messages/ns/Partners/pages/${locale}.json`)).default;
}

export async function generateMetadata({ params }: PageProps<"/[locale]/partners">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator({ locale, messages: await partnersMessages(locale) });
  // 독자 숫자를 공개할 수 있을 때(월 5만 PV 또는 팔로워 1만)까지는 검색에 내지 않는다 (docs/monetize/BM-VALIDATION.md §5-1)
  return trustFrameMetadata(locale, "/partners", { title: t("title"), description: t("description"), index: false });
}

// 협찬 안내: 9개 언어(숫자 크게) + 문의 → 누구를 위해 쓰나 → 패키지 2종 + '순위는 팔지 않는다' → 하지 않는 것 → 문의.
// 독자 수(PV)는 실측을 공개할 수 있을 때까지 싣지 않는다 — 빈 자리도 두지 않는다. 광고 칸 없음
export default async function PartnersPage({ params }: PageProps<"/[locale]/partners">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await partnersMessages(locale);
  const t = createTranslator({ locale, messages });
  const email = contactEmail();
  const mailto = email
    ? `mailto:${email}?subject=${encodeURIComponent(t("mailSubject"))}&body=${encodeURIComponent(t("mailBody"))}`
    : null;
  const regions = t.raw("regions") as Record<Locale, string>;
  const packages = t.raw("packages") as Package[];

  return (
    <TrustFrame
      locale={locale}
      path="/partners"
      title={t("title")}
      description={t("description")}
      lead={t("lead")}
      updated={UPDATED}
      updatedLabel={t("updated")}
      moreLabel={t("more")}
      links={[
        { href: "/disclosure", title: t("nav.disclosure") },
        { href: "/editorial-policy", title: t("nav.editorial") },
        { href: "/about", title: t("nav.about") },
        { href: "/contact", title: t("nav.contact") },
      ]}
      ld={
        email
          ? [
              {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                contactPoint: { "@type": "ContactPoint", email, contactType: "partnerships", availableLanguage: [...LOCALES] },
              },
            ]
          : []
      }
      intro={
        <div className="px-read pt-6">
          <p className="flex items-end gap-3">
            <span className="text-display font-bold tabular-nums text-ink-900">{LOCALES.length}</span>
            <span className="pb-1 text-t6 text-ink-600">{t("languages")}</span>
          </p>
          <Button href={mailto ?? "/contact"} size="l" block className="mt-6">
            {mailto ? t("ctaEmail") : t("ctaContact")}
          </Button>
        </div>
      }
    >
      <InfoSection id="audience" title={t("audienceTitle")}>
        <p>{t("audienceLead")}</p>
        <ul className="divide-y divide-line border-y border-line">
          {LOCALES.map((l) => (
            <li key={l} className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-0.5 py-2.5">
              <span lang={l} className="font-semibold text-ink-900">
                {LOCALE_NAME[l]}
              </span>
              <span className="text-t6 text-ink-600">{regions[l]}</span>
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection id="packages" title={t("packagesTitle")}>
        <ol className="space-y-3">
          {packages.map((pkg) => (
            <li key={pkg.name} className="rounded-card bg-card p-5 shadow-card">
              <h3 className="text-t4 font-bold text-ink-900">
                <Words text={pkg.name} locale={locale} />
              </h3>
              <p className="mt-2 text-t6 text-ink-700">{pkg.line}</p>
              <ul className="mt-3 space-y-2">
                {pkg.includes.map((line) => (
                  <li key={line} className="flex gap-2 text-t6 text-ink-700">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand-ink" />
                    {line}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        {/* 랭킹·어워드 자리는 팔지 않는다 (구매 링크가 달린 순위에 브랜드 돈이 섞이면 '독립 리뷰 위장'이 된다) */}
        <p className="rounded-card bg-brand-weak px-4 py-3 text-t5 font-semibold text-brand-ink">
          <Words text={t("notForSale")} locale={locale} />
        </p>
      </InfoSection>

      <InfoSection id="never" title={t("neverTitle")}>
        <InfoList items={t.raw("never") as string[]} />
      </InfoSection>

      <InfoSection id="contact" title={t("contactTitle")}>
        {mailto && email ? (
          <>
            <p>{t("contact")}</p>
            <Button href={mailto} size="l" variant="weak">
              {t("ctaEmail")}
            </Button>
            <p>
              <EmailLink email={email} />
            </p>
          </>
        ) : (
          <p>{t.rich("contactPending", { contact: inlineLink("/contact") })}</p>
        )}
      </InfoSection>
    </TrustFrame>
  );
}
