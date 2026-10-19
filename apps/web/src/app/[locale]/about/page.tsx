import { isLocale, LOCALE_NAME, LOCALE_PATH_PREFIX, LOCALES } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createTranslator } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import {
  CodeBlock,
  contactEmail,
  EmailLink,
  infoMetadata,
  InfoList,
  InfoPage,
  InfoSection,
  inlineLink,
  trustMessages,
} from "@/components/info/InfoPage";
import { SITE_URL } from "@/lib/url";

// 문구를 바꾸면 이 날짜도 올린다
const UPDATED = "2026-10-16";

// 수집기(apps/worker/src/collectors/http.ts)의 USER_AGENT 와 같은 문자열. #bot 이 UA 안의 주소다
const BOT_UA = `UnnieNoteBot/1.0 (+${SITE_URL}/en/about#bot)`;

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator({ locale, messages: await trustMessages(locale), namespace: "about" });
  return infoMetadata(locale, "about", { title: t("title"), description: t("description") });
}

// 소개: 누구·무엇·9개 언어·AI 작성 사실·데이터 출처, #bot 은 수집 봇 정책 (UA 에 이 주소가 들어간다)
export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await trustMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "about" });
  const email = contactEmail();

  return (
    <InfoPage
      locale={locale}
      page="about"
      schema="AboutPage"
      title={t("title")}
      description={t("description")}
      lead={t("lead")}
      updated={UPDATED}
      updatedLabel={messages.updated}
    >
      <InfoSection id="who" title={t("whoTitle")}>
        <p>{t("who")}</p>
      </InfoSection>

      <InfoSection id="languages" title={t("languagesTitle")}>
        <p>{t("languages")}</p>
        <ul className="flex flex-wrap gap-2">
          {LOCALES.map((l) => (
            <li key={l}>
              <a
                href={`${LOCALE_PATH_PREFIX[l]}/about`}
                hrefLang={l}
                lang={l}
                aria-current={l === locale ? "page" : undefined}
                className={`press hit relative inline-flex min-h-[38px] items-center whitespace-nowrap rounded-full px-3.5 text-t6 ${
                  l === locale
                    ? "bg-brand font-bold text-white"
                    : "bg-card font-semibold text-ink-700 ring-1 ring-line ring-inset"
                }`}
              >
                {LOCALE_NAME[l]}
              </a>
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection id="ai" title={t("aiTitle")}>
        <p>{t.rich("ai", { editorial: inlineLink("/editorial-policy") })}</p>
      </InfoSection>

      <InfoSection id="sources" title={t("sourcesTitle")}>
        <InfoList items={t.raw("sources") as string[]} />
        <p>{t("photos")}</p>
      </InfoSection>

      <InfoSection id="bot" title={t("botTitle")}>
        <p>{t("bot")}</p>
        <CodeBlock>{BOT_UA}</CodeBlock>
        <InfoList items={t.raw("botRules") as string[]} />
        <p>{t("botBlock")}</p>
        <CodeBlock>{"User-agent: UnnieNoteBot\nDisallow: /"}</CodeBlock>
        <p>{t.rich("botContact", { contact: inlineLink("/contact") })}</p>
        {email && (
          <p>
            <EmailLink email={email} />
          </p>
        )}
      </InfoSection>
    </InfoPage>
  );
}
