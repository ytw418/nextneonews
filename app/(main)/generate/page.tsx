import { Metadata } from "next";
import GenerateClient from "./GenerateClient";

export const metadata: Metadata = {
  title: "AI 뉴스 생성",
  description: "AI를 사용하여 새로운 뉴스를 생성합니다",
};

export default function GeneratePage() {
  return <GenerateClient />;
}
