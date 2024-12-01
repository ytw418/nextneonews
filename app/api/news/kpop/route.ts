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

    // Date 객체를 ISO 문자열로 변환
    const formattedNews = kpopNews.map((news) => ({
      ...news,
      createdAt: news.createdAt.toISOString(),
      updatedAt: news.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedNews);
  } catch (error) {
    console.error("K-pop news fetch error:", error);
    return NextResponse.json(
      { error: "뉴스를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
