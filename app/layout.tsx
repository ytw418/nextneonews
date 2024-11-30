import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Header from "@/components/layout/Header";

// MSW 초기화 (개발 환경에서만)
if (process.env.NODE_ENV === "development") {
  const enableMocking = async () => {
    const { worker } = await import("@/mocks/browser");
    await worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: {
        url: "/mockServiceWorker.js",
      },
    });
  };

  enableMocking()
  .catch(error => console.log(error));
}

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "neonews",
  description: "News platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
