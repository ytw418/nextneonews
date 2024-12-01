import React from "react";
import MainClient from "./MainClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "홈",
  description: "NeoNews의 최신 뉴스와 K-POP 소식을 확인하세요",
};

const Page = () => {
  return (
    <div>
      <MainClient />
    </div>
  );
};

export default Page;
