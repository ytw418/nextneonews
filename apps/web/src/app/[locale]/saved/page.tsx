import { isLocale } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/AppHeader";
import { SavedView } from "@/components/saved/SavedView";
import { pageRobots } from "@/lib/url";

export async function generateMetadata({ params }: PageProps<"/[locale]/saved">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Engage" });
  // 기기마다 내용이 다른 개인 화면이라 색인하지 않는다 (사이트맵에서도 뺀다)
  return { title: t("savedTitle"), robots: pageRobots(false) };
}

// 저장함 탭. 목록은 이 기기에만 있어서 화면은 클라이언트(SavedView)가 그리고 서버는 틀만 낸다. 광고 없음
export default async function SavedPage({ params }: PageProps<"/[locale]/saved">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Engage");

  return (
    <>
      <AppHeader title={t("savedTitle")} />
      <SavedView />
    </>
  );
}
