import { Metadata } from "next";
import WriteClient from "./WriteClient";

export const metadata: Metadata = {
  title: "뉴스 작성",
  description: "새로운 뉴스 기사를 작성합니다",
};

export default function WritePage() {
  return <WriteClient />;
}
