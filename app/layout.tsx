import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Header from "@/components/layout/Header";
import CommonClient from "@/components/CommonClient";

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
        <CommonClient />
        <Header />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
