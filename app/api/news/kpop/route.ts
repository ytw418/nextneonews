import { prisma } from "@/libs/prisma";
import { NextResponse } from "next/server";

// API 응답 타입 정의
export type KpopNewsResponse = {
  id: number;
  title: string;
  summary: string;
  content?: string;
  imageUrl: string;
  category: string;
  tags: string[];
  views: number;
  author?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}[];

export async function GET() {
  try {
    const kpopNews = await prisma.news.findMany({
      where: {
        category: {
          equals: "K-POP",
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    if (!kpopNews) {
      return NextResponse.json({ error: "News not found" }, { status: 404 });
    }

    const formattedNews = kpopNews.map((news) => ({
      ...news,
      createdAt: news.createdAt.toISOString(),
      updatedAt: news.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedNews);
  } catch (error) {
    console.error("K-pop news fetch error:", error);
    return NextResponse.json(
      { error: error, message: "뉴스를 불러오는데 실패하였습니다." },
      { status: 500 }
    );
  }
}
