import MainNewsClient from "./MainNewsClient";
import { getMainList } from "@/libs/utils/api";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "주요 뉴스 - K-POP 뉴스",
  description: "K-POP 관련 주요 뉴스를 확인하세요",
};

export default async function MainNewsPage() {
  const initialData = await getMainList(1);

  return <MainNewsClient initialData={initialData} />;
}
