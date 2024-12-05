import KpopClient from "./KpopClient";
import { getMainList } from "@/libs/utils/api";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "K-POP 뉴스 - K-POP 뉴스",
  description: "최신 K-POP 뉴스를 확인하세요",
};

export default async function KpopPage() {
  const initialData = await getMainList(1);

  return <KpopClient initialData={initialData} />;
}
