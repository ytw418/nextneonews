import { isLocale, type Locale } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createTranslator } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { InfoList, InfoSection, inlineLink } from "@/components/info/InfoPage";
import { Badge } from "@/components/ui/Badge";
import { type AffiliatePartner, PARTNER_NAME } from "@/lib/affiliate";

import type pagesEn from "../../../../messages/ns/Disclosure/pages/en.json";
import { TrustFrame, trustFrameMetadata } from "../partners/_ui/TrustFrame";

// 문구·파트너를 바꾸면 이 날짜도 올린다
const UPDATED = "2026-10-19";

export const revalidate = 3600;

// 긴 본문은 provider 밖 pages 파일에 둔다 (Trust/pages 와 같은 방식)
async function disclosureMessages(locale: Locale): Promise<typeof pagesEn> {
  return (await import(`../../../../messages/ns/Disclosure/pages/${locale}.json`)).default;
}

export async function generateMetadata({ params }: PageProps<"/[locale]/disclosure">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator({ locale, messages: await disclosureMessages(locale) });
  return trustFrameMetadata(locale, "/disclosure", { title: t("title"), description: t("description"), index: true });
}

// 제휴 고지(공정위 추천·보증 심사지침, 모든 제휴 상자 첫 줄의 '자세히' 링크가 여기로 온다):
// 수수료 원리·가격 불변 → 파트너 목록(lib/affiliate.ts PARTNER_NAME + 쿠팡) → 표시 방법 → 편집 독립 → 의료 무제휴 → 카탈로그 작성 방식(AI 보조) → 문의.
// 광고 칸 없음
export default async function DisclosurePage({ params }: PageProps<"/[locale]/disclosure">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [messages, tAffiliate] = await Promise.all([
    disclosureMessages(locale),
    getTranslations({ locale, namespace: "Affiliate" }),
  ]);
  const t = createTranslator({ locale, messages });
  const uses = t.raw("partnerUse") as Record<AffiliatePartner, string>;
  const partners = Object.keys(PARTNER_NAME) as AffiliatePartner[];

  return (
    <TrustFrame
      locale={locale}
      path="/disclosure"
      title={t("title")}
      description={t("description")}
      lead={t("lead")}
      updated={UPDATED}
      updatedLabel={t("updated")}
      moreLabel={t("more")}
      links={[
        { href: "/partners", title: t("nav.partners") },
        { href: "/editorial-policy", title: t("nav.editorial") },
        { href: "/privacy", title: t("nav.privacy") },
        { href: "/contact", title: t("nav.contact") },
      ]}
    >
      <InfoSection id="how" title={t("howTitle")}>
        <p>{t("how")}</p>
        <p className="text-t6 text-ink-600">{t("sampleLabel")}</p>
        {/* 제휴 상자(AffiliateBox) 첫 줄과 같은 글자. 이 페이지로 오는 '자세히' 링크는 뺀다 */}
        <p className="flex items-start gap-2 rounded-card bg-card px-4 py-3 text-t7 text-ink-600 shadow-card">
          <Badge tone="neutral" className="shrink-0">
            {tAffiliate("prLabel")}
          </Badge>
          <span className={`pt-0.5 ${locale === "ko" ? "[word-break:keep-all]" : ""}`}>
            {tAffiliate.rich("disclosure", { link: () => null })}
          </span>
        </p>
      </InfoSection>

      <InfoSection id="partners" title={t("partnersTitle")}>
        <p>{t("partnersLead")}</p>
        <ul className="divide-y divide-line border-y border-line">
          {[
            ...partners.map((partner) => ({ key: partner, name: PARTNER_NAME[partner], use: uses[partner] })),
            { key: "coupang", name: t("coupang"), use: t("coupangUse") },
          ].map((row) => (
            <li key={row.key} className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-0.5 py-2.5">
              <span className="font-semibold text-ink-900">{row.name}</span>
              <span className="text-t6 text-ink-600">{row.use}</span>
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection id="labels" title={t("labelTitle")}>
        <InfoList items={t.raw("label") as string[]} />
      </InfoSection>

      <InfoSection id="independence" title={t("independenceTitle")}>
        <p>{t("independence")}</p>
      </InfoSection>

      <InfoSection id="medical" title={t("medicalTitle")}>
        <p>{t.rich("medical", { clinic: inlineLink("/clinic") })}</p>
      </InfoSection>

      <InfoSection id="catalog" title={t("catalogTitle")}>
        <p>{t("catalog")}</p>
      </InfoSection>

      <InfoSection id="questions" title={t("contactTitle")}>
        <p>{t.rich("contact", { contact: inlineLink("/contact") })}</p>
      </InfoSection>
    </TrustFrame>
  );
}
