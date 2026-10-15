import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Cormorant, Instrument_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SITE_NAME } from "@kmedia/core";

import { JsonLd } from "@/components/JsonLd";
import { LocaleSuggest } from "@/components/LocaleSuggest";
import { TabBar } from "@/components/TabBar";
import { routing } from "@/i18n/routing";
import { siteJsonLd } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/url";

import "../globals.css";

// 라틴 포인트 서체만 웹폰트. next/font 가 빌드 때 받아 우리 도메인에서 제공한다 (중국에서도 막히지 않음)
const instrument = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
// Instrument Serif 에 없는 베트남어 성조·키릴 문자용 제목 서체. vi·ru 페이지에서만 쓰므로 미리 받지 않는다
const cormorant = Cormorant({
  weight: "500",
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese", "cyrillic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // 노치·홈 바까지 화면을 쓰고 safe-area 로 여백을 준다
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#141016" },
  ],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Site" });

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
    description: t("tagline"),
    appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${instrument.variable} ${bricolage.variable} ${cormorant.variable}`}>
      <body className="min-h-svh antialiased">
        <JsonLd data={siteJsonLd(locale)} />
        <NextIntlClientProvider>
          <div className="mx-auto max-w-[640px] pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+12px)]">
            {children}
          </div>
          <TabBar />
          <LocaleSuggest />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
