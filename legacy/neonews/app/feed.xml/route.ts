import { prisma } from "@/libs/prisma";
import RSS from "rss";

export async function GET() {
  const feed = new RSS({
    title: "NeoNews",
    description: "최신 뉴스와 K-POP 소식을 실시간으로 전달하는 뉴스 플랫폼",
    feed_url: "https://nextneonews.vercel.app/feed.xml",
    site_url: "https://nextneonews.vercel.app",
    language: "ko",
    categories: ["뉴스", "K-POP"],
  });

  const posts = await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    where: {
      language: "ko", // 한국어 게시물만
    },
  });

  posts.forEach((post) => {
    feed.item({
      title: post.title,
      description: post.summary || post.content,
      url: `https://nextneonews.vercel.app/post/${post.id}`,
      categories: [post.category],
      date: post.createdAt,
      enclosure: post.imageUrl ? { url: post.imageUrl } : undefined,
    });
  });

  return new Response(feed.xml(), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
