import { prisma } from "@/libs/prisma";
import { NextRequest, NextResponse } from "next/server";

// 요청 타입 정의
export interface MainListRequestQuery {
  page?: string;
}

// 응답 타입 정의
export interface MainListResponseItem {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface MainListResponse {
  currentPage: number;
  totalPages: number;
  popularNews: MainListResponseItem[];
  kpopNews: MainListResponseItem[];
  mainNews: MainListResponseItem[];
  aiNews: MainListResponseItem[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const size = 4; // 각 섹션당 4개의 뉴스

    // 각 카테고리별 뉴스 조회
    const [popularNews, kpopNews, mainNews, aiNews] = await Promise.all([
      prisma.news.findMany({
        orderBy: { views: "desc" },
        take: size,
        skip: (page - 1) * size,
      }),
      prisma.news.findMany({
        where: { category: "K-POP" },
        orderBy: { createdAt: "desc" },
        take: size,
        skip: (page - 1) * size,
      }),
      prisma.news.findMany({
        where: { category: "MAIN" },
        orderBy: { createdAt: "desc" },
        take: size,
        skip: (page - 1) * size,
      }),
      prisma.news.findMany({
        where: { category: "AI" },
        orderBy: { createdAt: "desc" },
        take: size,
        skip: (page - 1) * size,
      }),
    ]);

    // 전체 페이지 수 계산을 위한 총 뉴스 수 조회
    const totalNews = await prisma.news.count();
    const totalPages = Math.ceil(totalNews / (size * 4)); // 4개 섹션

    const response: MainListResponse = {
      currentPage: page,
      totalPages,
      popularNews,
      kpopNews,
      mainNews,
      aiNews,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching main list:", error);
    return NextResponse.json(
      { error: "Failed to fetch main list" },
      { status: 500 }
    );
  }
}
