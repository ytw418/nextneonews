import { mainNews, kpopNews } from "@/mocks/data/news";
import { NextResponse } from "next/server";

import { NewsCardProps } from "@/components/common/NewsCard";

export interface PostDetail extends NewsCardProps {
  content?: string;
  views: number;
  author: string;
  relatedNews: NewsCardProps[];
  source: string;
  publishedAt: string;
  updatedAt?: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const allNews = [...mainNews, ...kpopNews];
    const newsItem = allNews.find((news) => news.id.toString() === params.id);

    if (!newsItem) {
      return NextResponse.json(
        { error: "포스트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const postDetail: PostDetail = {
      ...newsItem,
      content: newsItem.content,
      views: Math.floor(Math.random() * 1000) + 100,
      author: "NeoNews 기자",
      relatedNews: allNews
        .filter(
          (news) =>
            news.id !== newsItem.id && news.category === newsItem.category
        )
        .slice(0, 3),
      source: "NeoNews",
      publishedAt: newsItem.date,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(postDetail);
  } catch (error) {
    console.error("Post detail fetch error:", error);
    return NextResponse.json(
      { error: "포스트를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
