import { Metadata } from "next";
import MainClient from "./MainClient";
import { getMainNews, getKpopNews, getSlides } from "@/libs/utils/api";

export const metadata: Metadata = {
  title: "홈",
  description: "NeoNews의 최신 뉴스와 K-POP 소식을 확인하세요",
};

export const revalidate = 60;

export default async function Page() {
  const [mainNews, kpopNews, slides] = await Promise.all([
    getMainNews(),
    getKpopNews(),
    getSlides(),
  ]);

  return (
    <MainClient
      initialData={{
        "/api/news/main": mainNews,
        "/api/news/kpop": kpopNews,
        "/api/slides": slides,
      }}
    />
  );
}
