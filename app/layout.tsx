import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Header from "@/components/layout/Header";
import Providers from "@/components/providers/Providers";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";

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
    google: "YV_Riopc7DmVS7LUL6geEhhs2DmQghxBUUBoeuTWhR0",
    // naver: "7264ef2ef4d80fdcce4984c88b028090ec7720a4",
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
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <Providers initialData={initialData}>
          <Header />
          <main className="pt-14">{children}</main>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
