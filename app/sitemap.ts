import { MetadataRoute } from "next";
import { getMainNews, getKpopNews } from "@/libs/utils/api";

// 사이트맵에 포함할 정적 경로들
const staticRoutes = [
  "", // 홈페이지
  "/about",
  "/contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // 모든 뉴스 데이터 가져오기
    const [mainNews, kpopNews] = await Promise.all([
      getMainNews(),
      getKpopNews(),
    ]);

    // 정적 경로에 대한 사이트맵 항목 생성
    const staticPaths = staticRoutes.map((route) => ({
      url: `${process.env.NEXT_PUBLIC_API_URL}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: route === "" ? 1 : 0.8,
    }));

    // 동적 뉴스 페이지에 대한 사이트맵 항목 생성
    const allNews = [...mainNews, ...kpopNews];
    const dynamicPaths = allNews.map((news) => ({
      url: `${process.env.NEXT_PUBLIC_API_URL}/post/${news.id}`,
      lastModified: new Date(news.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticPaths, ...dynamicPaths];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    // 에러 발생 시 기본 정적 경로만 반환
    return staticRoutes.map((route) => ({
      url: `${process.env.NEXT_PUBLIC_API_URL}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: route === "" ? 1 : 0.8,
    }));
  }
}
