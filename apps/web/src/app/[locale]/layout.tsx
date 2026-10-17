import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SITE_NAME } from "@kmedia/core";

import { Analytics } from "@/components/Analytics";
import { ChromeEffects } from "@/components/ChromeEffects";
import { HeadScripts } from "@/components/HeadScripts";
import { InstallPrompt } from "@/components/InstallPrompt";
import { JsonLd } from "@/components/JsonLd";
import { LocaleSuggest } from "@/components/LocaleSuggest";
import { SiteFooter } from "@/components/SiteFooter";
import { TabBar } from "@/components/TabBar";
import { Toaster } from "@/components/ui/Toast";
import { routing } from "@/i18n/routing";
import { adsenseClient } from "@/lib/ads";
import { INSTALL_CAPTURE_SCRIPT } from "@/lib/install";
import { siteJsonLd } from "@/lib/jsonld";
import { feedAlternate, GOOGLEBOT_PREVIEW, pageRobots, SITE_URL } from "@/lib/url";

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

// 검색엔진 사이트 소유 확인 메타 (구글 서치 콘솔, 네이버 서치어드바이저, 빙 웹마스터, 얀덱스). 운영 배포에서 값이 있을 때만
function siteVerification(): Metadata["verification"] {
  if (process.env.VERCEL_ENV !== "production") return undefined;
  const env = (key: string) => process.env[key]?.trim() || undefined;
  const other = Object.fromEntries(
    [
      ["naver-site-verification", env("NAVER_SITE_VERIFICATION")],
      ["msvalidate.01", env("BING_SITE_VERIFICATION")],
    ].filter((entry): entry is [string, string] => !!entry[1]),
  );
  return { google: env("GOOGLE_SITE_VERIFICATION"), yandex: env("YANDEX_SITE_VERIFICATION"), other };
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Site" });
  const adsense = adsenseClient();

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
    description: t("tagline"),
    appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
    // 디스커버·검색에 큰 사진과 긴 스니펫 허용. noindex 로 바꾸는 페이지도 pageRobots(false) 로 이 값을 이어 간다
    robots: pageRobots(),
    // 안전망: 페이지가 robots 키를 내면(undefined 라도) 위 값이 통째로 사라진다. googlebot 메타는 따로 남겨
    // 구글이 어느 페이지에서나 큰 사진 미리보기를 쓰게 한다 (색인 여부는 robots 메타가 정한다)
    // 애드센스 사이트 소유 확인 메타 (운영 배포에서 게시자 id 가 있을 때만)
    other: { googlebot: GOOGLEBOT_PREVIEW, ...(adsense ? { "google-adsense-account": adsense } : {}) },
    verification: siteVerification(),
    // alternates 를 내지 않는 페이지에도 이 언어 RSS 를 알린다
    alternates: { types: feedAlternate(locale) },
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
      <head>
        <HeadScripts />
      </head>
      <body className="min-h-svh antialiased">
        <script dangerouslySetInnerHTML={{ __html: INSTALL_CAPTURE_SCRIPT }} />
        <JsonLd data={siteJsonLd(locale)} />
        <NextIntlClientProvider>
          {/* 하단 탭바·고정 CTA(--bottom-ui)에 마지막 줄이 가리지 않게 아래 여백을 둔다 */}
          <main id="main" className="mx-auto max-w-[640px] pb-[calc(var(--bottom-ui)+24px)]">
            {children}
            <SiteFooter locale={locale} />
          </main>
          <TabBar />
          <Toaster />
          <ChromeEffects />
          {/* 언어 제안이 먼저, 그다음 설치 안내 (같은 자리라 함께 뜨지 않는다) */}
          <LocaleSuggest />
          <InstallPrompt />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
