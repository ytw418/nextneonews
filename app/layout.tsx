import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Header from "@/components/layout/Header";
import CommonClient from "@/components/CommonClient";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | NeoNews",
    default: "NeoNews - 실시간 뉴스와 K-POP 소식",
  },
  description: "최신 뉴스와 K-POP 소식을 실시간으로 전달하는 뉴스 플랫폼",
  keywords: ["뉴스", "K-POP", "실시간뉴스", "케이팝", "한류"],
  authors: [{ name: "NeoNews" }],
  creator: "NeoNews",
  publisher: "NeoNews",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "NeoNews - 실시간 뉴스와 K-POP 소식",
    description: "최신 뉴스와 K-POP 소식을 실시간으로 전달하는 뉴스 플랫폼",
    url: "https://neonews.com",
    siteName: "NeoNews",
    locale: "ko_KR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code", // Google Search Console 코드
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <CommonClient />
        <Header />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
