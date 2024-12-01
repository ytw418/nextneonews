import { prisma } from "@/libs/prisma";
import { NextResponse } from "next/server";

// API 응답 타입 정의
export type MainNewsResponse = {
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
    const mainNews = await prisma.news.findMany({
      where: {
        category: {
          notIn: ["K-POP"],
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    const formattedNews = mainNews.map((news) => ({
      ...news,
      createdAt: news.createdAt.toISOString(),
      updatedAt: news.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedNews);
  } catch (error) {
    console.error("Main news fetch error:", error);
    return NextResponse.json(
      { error: "뉴스를 불러오는데 실패하였습니다." },
      { status: 500 }
    );
  }
}
