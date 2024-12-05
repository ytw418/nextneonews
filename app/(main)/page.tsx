import { Metadata } from "next";
import MainClient from "./MainClient";
import { getMainList, getSlides } from "@/libs/utils/api";

// export const metadata: Metadata = {
//   title: "홈",
//   description: "NeoNews의 최신 뉴스와 K-POP 소식을 확인하세요",
// };

export const revalidate = 60;

export default async function Page() {
  const [initialMainList, slides] = await Promise.all([
    getMainList(1),
    getSlides(),
  ]);

  return <MainClient initialData={initialMainList} slides={slides} />;
}
