import { prisma } from "@/libs/prisma";
import { NextResponse } from "next/server";

export interface PostDetail {
  id: number;
  title: string;
  summary: string;
  content: string | null;
  imageUrl: string;
  category: string;
  tags: string[];
  views: number;
  author: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  relatedNews: {
    id: number;
    title: string;
    summary: string;
    imageUrl: string;
    category: string;
    tags: string[];
    createdAt: string;
  }[];
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const newsItem = await prisma.news.findUnique({
      where: {
        id: parseInt(params.id),
      },
    });

    if (!newsItem) {
      return NextResponse.json(
        { error: "포스트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const relatedNews = await prisma.news.findMany({
      where: {
        AND: [{ category: newsItem.category }, { id: { not: newsItem.id } }],
      },
      take: 3,
      orderBy: {
        createdAt: "desc",
      },
    });

    const postDetail: PostDetail = {
      id: newsItem.id,
      title: newsItem.title,
      summary: newsItem.summary,
      content: newsItem.content,
      imageUrl: newsItem.imageUrl,
      category: newsItem.category,
      tags: newsItem.tags,
      views: newsItem.views,
      author: newsItem.author,
      source: newsItem.source,
      createdAt: newsItem.createdAt.toISOString(),
      updatedAt: newsItem.updatedAt.toISOString(),
      relatedNews: relatedNews.map((news) => ({
        ...news,
        createdAt: news.createdAt.toISOString(),
      })),
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
