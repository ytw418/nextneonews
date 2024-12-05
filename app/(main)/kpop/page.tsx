import KpopClient from "./KpopClient";
import { getNewsList } from "@/libs/utils/api";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "K-POP 뉴스 - K-POP 뉴스",
  description: "최신 K-POP 뉴스를 확인하세요",
};

export const revalidate = 60;

export default async function KpopPage() {
  const initialData = await getNewsList({ category: "K-POP" });
  return <KpopClient initialData={initialData} />;
}
