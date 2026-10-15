import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SITE_NAME } from "@kmedia/core";

import { ChromeEffects } from "@/components/ChromeEffects";
import { JsonLd } from "@/components/JsonLd";
import { LocaleSuggest } from "@/components/LocaleSuggest";
import { TabBar } from "@/components/TabBar";
import { Toaster } from "@/components/ui/Toast";
import { routing } from "@/i18n/routing";
import { siteJsonLd } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/url";

import "../globals.css";

// 웹폰트는 로고(.wordmark) 하나뿐. next/font 가 빌드 때 받아 우리 도메인에서 제공한다 (중국에서도 막히지 않음)
const instrument = Instrument_Serif({
  weight: "400",
  style: ["italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
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
    <html lang={locale} className={instrument.variable}>
      <body className="min-h-svh antialiased">
        <JsonLd data={siteJsonLd(locale)} />
        <NextIntlClientProvider>
          {/* 하단 탭바·고정 CTA(--bottom-ui)에 마지막 줄이 가리지 않게 아래 여백을 둔다 */}
          <main id="main" className="mx-auto max-w-[640px] pb-[calc(var(--bottom-ui)+24px)]">
            {children}
          </main>
          <TabBar />
          <Toaster />
          <ChromeEffects />
          <LocaleSuggest />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
