import PopularClient from "./PopularClient";
import { getMainList } from "@/libs/utils/api";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "인기 뉴스 - K-POP 뉴스",
  description: "가장 인기있는 K-POP 관련 뉴스를 확인하세요",
};

export default async function PopularPage() {
  const initialData = await getMainList(1);

  return <PopularClient initialData={initialData} />;
}
