import LatestNewsClient from "./LatestNewsClient";
import { getNewsList } from "@/libs/utils/api";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "최신 뉴스 - K-POP 뉴스",
  description: "K-POP 관련 최신 뉴스를 확인하세요",
};

export default async function LatestNewsPage() {
  const initialData = await getNewsList();
  return <LatestNewsClient initialData={initialData} />;
}
