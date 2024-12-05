import { Metadata } from "next";
import CrawlerTestClient from "./CrawlerTestClient";

export const metadata: Metadata = {
  title: "크롤링 테스트",
  description: "네이버 연예뉴스 크롤링 테스트",
};

export default function CrawlerTestPage() {
  return <CrawlerTestClient />;
}
