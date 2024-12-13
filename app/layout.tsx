import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { CategoryMenu } from "@/components/layout/CategoryMenu";
import Providers from "@/components/providers/Providers";
import { Analytics } from "@vercel/analytics/react";
import { Footer } from "@/components/layout/Footer";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://nextneonews.vercel.app"),
  title: {
    template: "%s | NeoNews",
    default: "NeoNews - 실시간 K-POP 뉴스 플랫폼",
  },
  description:
    "실시간으로 업데이트되는 K-POP 뉴스, 아이돌 소식, 한류 콘텐츠를 가장 빠르게 전달하는 뉴스 플랫폼",
  keywords: [
    "K-POP",
    "케이팝",
    "한류",
    "아이돌",
    "실시간뉴스",
    "연예뉴스",
    "KPOP뉴스",
    "한국가수",
    "한국연예인",
    "KoreanPop",
    "KoreanNews",
    "KpopNews",
    "韓流",
    "Kポップ",
    "韓国アイドル",
    "韓流",
    "韓娛",
    "韓國偶像",
    "K-поп",
    "Корейская волна",
    "K-pop français",
    "Vague coréenne",
  ],
  authors: [{ name: "NeoNews", url: "https://nextneonews.vercel.app" }],
  creator: "NeoNews",
  publisher: "NeoNews",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/ko",
      "en-US": "/en",
      "ja-JP": "/ja",
      "zh-CN": "/zh-cn",
      "zh-TW": "/zh-tw",
      "ru-RU": "/ru",
      "fr-FR": "/fr",
    },
  },
  openGraph: {
    title: "NeoNews - 실시간 K-POP 뉴스 플랫폼",
    description:
      "실시간으로 업데이트되는 K-POP 뉴스, 아이돌 소식, 한류 콘텐츠를 가장 빠르게 전달하는 뉴스 플랫폼",
    url: "https://nextneonews.vercel.app",
    siteName: "NeoNews",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/images/aespa.png",
        width: 1200,
        height: 630,
        alt: "NeoNews - K-POP 뉴스",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NeoNews - 실시간 K-POP 뉴스 플랫폼",
    description: "실시간으로 업데이트되는 K-POP 뉴스, 아이돌 소식, 한류 콘텐츠",
    images: ["/images/aespa.png"],
    creator: "@neonews",
    site: "@neonews",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "YV_Riopc7DmVS7LUL6geEhhs2DmQghxBUUBoeuTWhR0",
    other: {
      "naver-site-verification": "7264ef2ef4d80fdcce4984c88b028090ec7720a4",
      "msvalidate.01": "",
      "yandex-verification": "",
    },
  },
  other: {
    "google-adsense-account": "ca-pub-8957945516038764",
    "facebook-domain-verification": "",
  },
  category: "news",
  classification: "entertainment",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "NeoNews",
    statusBarStyle: "default",
    capable: true,
  },
};

// 서버 컴포넌트에서 초기 데이터를 가져오는 함수
async function getInitialData() {
  // 전역적으로 필요한 초기 데이터를 가져옵니다
  // 예: 사용자 정보, 공통 설정 등
  return {};
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialData = await getInitialData();

  return (
    <html lang="ko" suppressHydrationWarning={true}>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8957945516038764"
        crossOrigin="anonymous"
      ></Script>
      <body className={inter.className}>
        <Providers initialData={initialData}>
          <Header />
          <CategoryMenu />
          <main className="pt-14">{children}</main>
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
