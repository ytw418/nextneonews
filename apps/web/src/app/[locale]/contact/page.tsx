import { isLocale, LOCALES } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createTranslator } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import {
  contactEmail,
  EmailLink,
  infoMetadata,
  InfoPage,
  InfoSection,
  trustMessages,
} from "@/components/info/InfoPage";
import { ListRow } from "@/components/ui/ListRow";
import { SITE_URL } from "@/lib/url";

// 문구를 바꾸면 이 날짜도 올린다
const UPDATED = "2026-10-16";

export const revalidate = 3600;

// 용도별 메일: 제목·본문 틀을 미리 채워서 받은편지함에서 바로 나눠 볼 수 있게
const TOPICS = ["correction", "removal", "partnership"] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator({ locale, messages: await trustMessages(locale), namespace: "contact" });
  // 주소가 아직 없으면 '준비 중' 페이지라 색인하지 않는다
  return infoMetadata(locale, "contact", {
    title: t("title"),
    description: t("description"),
    noindex: !contactEmail(),
  });
}

// 문의: NEXT_PUBLIC_CONTACT_EMAIL 로 정정·삭제(게시중단)·제휴 메일을 연다
export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await trustMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "contact" });
  const email = contactEmail();
  const mailto = (topic: (typeof TOPICS)[number]) =>
    `mailto:${email}?subject=${encodeURIComponent(t(`${topic}Subject`))}&body=${encodeURIComponent(t(`${topic}Body`))}`;

  return (
    <InfoPage
      locale={locale}
      page="contact"
      schema="ContactPage"
      title={t("title")}
      description={t("description")}
      lead={email ? t("lead") : t("pending")}
      updated={UPDATED}
      updatedLabel={messages.updated}
      ld={
        email
          ? {
              // 레이아웃의 Organization 노드(@id)에 문의처를 붙인다
              mainEntity: {
                "@id": `${SITE_URL}/#organization`,
                contactPoint: {
                  "@type": "ContactPoint",
                  email,
                  contactType: "editorial",
                  availableLanguage: [...LOCALES],
                },
              },
            }
          : undefined
      }
    >
      {email && (
        <>
          <ul className="mt-6">
            {TOPICS.map((topic) => (
              <ListRow key={topic} href={mailto(topic)} inset="read" arrow title={t(topic)} sub={t(`${topic}Sub`)} />
            ))}
          </ul>
          <InfoSection id="email" title={t("emailTitle")}>
            <p>
              <EmailLink email={email} />
            </p>
          </InfoSection>
        </>
      )}

      <InfoSection id="comments" title={t("commentsTitle")}>
        <p>{t("comments")}</p>
      </InfoSection>
    </InfoPage>
  );
}
