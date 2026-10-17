import { isLocale } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createTranslator } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { infoMetadata, InfoList, InfoPage, InfoSection, inlineLink, trustMessages } from "@/components/info/InfoPage";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

// 문구를 바꾸면 이 날짜도 올린다
const UPDATED = "2026-10-17";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[locale]/editorial-policy">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator({ locale, messages: await trustMessages(locale), namespace: "editorial" });
  return infoMetadata(locale, "editorial", { title: t("title"), description: t("description") });
}

// 편집 방침: AI 초안과 자동 검사(숫자 대조·원문 겹침 25%), 출처 등급, 커뮤니티 규칙, 정정·게시중단(24시간), 투표·랭킹
export default async function EditorialPolicyPage({ params }: PageProps<"/[locale]/editorial-policy">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await trustMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "editorial" });
  const contact = inlineLink("/contact");

  // 출처 등급: 사실을 인용할 수 있는 곳과 반응 신호로만 쓰는 곳
  const tiers: { name: string; text: string; badge: string; tone: BadgeTone }[] = [
    { name: t("tierOfficial"), text: t("tierOfficialText"), badge: t("badgeFacts"), tone: "brandWeak" },
    { name: t("tierPress"), text: t("tierPressText"), badge: t("badgeFacts"), tone: "brandWeak" },
    { name: t("tierCommunity"), text: t("tierCommunityText"), badge: t("badgeReactions"), tone: "neutral" },
  ];

  return (
    <InfoPage
      locale={locale}
      page="editorial"
      schema="WebPage"
      title={t("title")}
      description={t("description")}
      lead={t("lead")}
      updated={UPDATED}
      updatedLabel={messages.updated}
    >
      <InfoSection id="ai" title={t("aiTitle")}>
        <p>{t("ai")}</p>
        <InfoList items={t.raw("aiChecks") as string[]} />
        <p>{t("aiReview")}</p>
      </InfoSection>

      <InfoSection id="sources" title={t("sourcesTitle")}>
        <ol className="divide-y divide-line border-y border-line">
          {tiers.map((tier, i) => (
            <li key={tier.name} className="grid grid-cols-[24px_1fr] gap-x-2 py-4">
              <span aria-hidden className="font-bold tabular-nums text-ink-600">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-ink-900">{tier.name}</span>
                  <Badge tone={tier.tone}>{tier.badge}</Badge>
                </span>
                <span className="mt-1 block text-t6 text-ink-700">{tier.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </InfoSection>

      <InfoSection id="community" title={t("communityTitle")}>
        <InfoList items={t.raw("communityRules") as string[]} />
      </InfoSection>

      <InfoSection id="rumors" title={t("rumorsTitle")}>
        <p>{t("rumors")}</p>
      </InfoSection>

      <InfoSection id="photos" title={t("photosTitle")}>
        <p>{t("photos")}</p>
      </InfoSection>

      <InfoSection id="corrections" title={t("correctionsTitle")}>
        <p>{t.rich("corrections", { contact })}</p>
      </InfoSection>

      <InfoSection id="takedown" title={t("takedownTitle")}>
        <p>{t.rich("takedown", { contact })}</p>
      </InfoSection>

      <InfoSection id="polls" title={t("pollsTitle")}>
        <p>{t("polls")}</p>
      </InfoSection>

      <InfoSection id="rankings" title={t("rankingsTitle")}>
        <p>{t.rich("rankings", { methodology: inlineLink("/rankings/methodology") })}</p>
      </InfoSection>

      <InfoSection id="ads" title={t("adsTitle")}>
        <p>{t("ads")}</p>
      </InfoSection>
    </InfoPage>
  );
}
