import { MetadataRoute } from "next";

// 사이트맵에 포함할 정적 경로들
const staticRoutes = [
  "", // 홈페이지
  "/about",
  "/contact",
  // 추가 정적 경로들...
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // API에서 모든 게시물 데이터 가져오기
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const posts = await fetch(`${baseUrl}/api/posts`).then((res) => res.json());

    // 정적 경로에 대한 사이트맵 항목 생성
    const staticPaths = staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: route === "" ? 1 : 0.8, // 홈페이지는 우선순위 1, 나머지는 0.8
    }));

    // 동적 게시물 경로에 대한 사이트맵 항목 생성
    const dynamicPaths = posts.map((post: any) => ({
      url: `${baseUrl}/post/${post.id}`,
      lastModified: new Date(post.updatedAt || post.date),
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
