import { isLocale } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createTranslator } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import {
  infoMetadata,
  InfoList,
  InfoPage,
  InfoSection,
  inlineLink,
  outboundLink,
  trustMessages,
} from "@/components/info/InfoPage";

// 문구를 바꾸면 이 날짜도 올린다
const UPDATED = "2026-10-20";

export const revalidate = 3600;

// 기기에 남기는 값. 새 키를 쓰면 여기와 messages/ns/Trust/pages 의 storageKeys·sessionKeys 에도 넣는다
// (Comments·InstallPrompt·LocaleSuggest·CelebrateOnce, 투표·반응·응원·다음 글, 저장·도장·항목 평가·피부 타입 테스트)
const STORAGE_KEYS = [
  ["hb:comment-key", "commentKey"],
  ["hb:comment-name", "commentName"],
  ["hb:my-comments", "myComments"],
  ["hb:poll:{id}", "poll"],
  ["hb:react:{id}", "react"],
  ["hb:cheer:{id}:{day}", "cheer"],
  ["hb:read", "read"],
  ["hb:install-dismissed-at", "install"],
  ["hb:locale-suggest-dismissed", "localeSuggest"],
  ["hb:saved", "saved"],
  ["hb:visited", "visited"],
  ["hb:vote:{kind}:{id}", "vote"],
  ["hb:skin-type", "skinType"],
] as const;

const SESSION_KEYS = [
  ["hb:install-seen", "installSeen"],
  ["hb:locale-suggest-seen", "localeSeen"],
  ["hb:celebrate:{id}", "celebrate"],
] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator({ locale, messages: await trustMessages(locale), namespace: "privacy" });
  return infoMetadata(locale, "privacy", { title: t("title"), description: t("description") });
}

function KeyList({ items }: { items: { key: string; text: string }[] }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <li key={item.key} className="py-3">
          <code className="text-t7 font-semibold break-all text-ink-900">{item.key}</code>
          <span className="mt-0.5 block text-t6 text-ink-700">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

// 개인정보: 회원가입 없음, IP 는 HMAC 해시로만(댓글·투표·항목 평가, 시술 경험 답은 익명 집계용), GA4·EEA 동의 모드, PostHog(쿠키 없음, 저장·평가 이벤트 포함),
// 광고(애드센스)·제휴 배너(쿠팡)·쇼핑 링크 쿠키, 기기 저장 키 목록(저장 목록은 /api/saved 로 제목만 조회), 보관 기간.
// 실제 전송·저장(components/saved/summaries.ts, SaveButton·ItemVote 의 track, lib/item-votes.ts)을 바꾸면 Trust/pages 문구도 같이 고친다
export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await trustMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "privacy" });

  return (
    <InfoPage
      locale={locale}
      page="privacy"
      schema="WebPage"
      title={t("title")}
      description={t("description")}
      lead={t("lead")}
      updated={UPDATED}
      updatedLabel={messages.updated}
    >
      <InfoSection id="no-account" title={t("noAccountTitle")}>
        <p>{t("noAccount")}</p>
      </InfoSection>

      <InfoSection id="hash" title={t("hashTitle")}>
        <p>{t("hash")}</p>
        <InfoList items={t.raw("hashItems") as string[]} />
      </InfoSection>

      <InfoSection id="analytics" title={t("analyticsTitle")}>
        <p>{t("analytics")}</p>
        <p>{t("posthog")}</p>
      </InfoSection>

      {/* 애드센스 개인정보처리방침 필수 문구: 제3자 쿠키·구글 광고 쿠키·거부 방법(광고 설정·aboutads) */}
      <InfoSection id="ads" title={t("adsTitle")}>
        <p>
          {t.rich("ads", {
            google: outboundLink("https://adssettings.google.com"),
            aboutads: outboundLink("https://www.aboutads.info"),
          })}
        </p>
        <p>{t("affiliate")}</p>
      </InfoSection>

      <InfoSection id="storage" title={t("storageTitle")}>
        <p>{t("storage")}</p>
        <KeyList items={STORAGE_KEYS.map(([key, name]) => ({ key, text: t(`storageKeys.${name}`) }))} />
        <p>{t("session")}</p>
        <KeyList items={SESSION_KEYS.map(([key, name]) => ({ key, text: t(`sessionKeys.${name}`) }))} />
        <p>{t("cookies")}</p>
      </InfoSection>

      <InfoSection id="retention" title={t("retentionTitle")}>
        <InfoList items={t.raw("retention") as string[]} />
      </InfoSection>

      <InfoSection id="services" title={t("servicesTitle")}>
        <p>{t("services")}</p>
      </InfoSection>

      <InfoSection id="rights" title={t("rightsTitle")}>
        <p>{t.rich("rights", { contact: inlineLink("/contact") })}</p>
      </InfoSection>
    </InfoPage>
  );
}
