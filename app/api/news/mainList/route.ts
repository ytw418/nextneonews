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
  imageUrl: string;
  category: string;
  createdAt: Date;
}

export interface MainListResponse {
  popularNews: MainListResponseItem[];
  kpopNews: MainListResponseItem[];
  mainNews: MainListResponseItem[];
  aiNews: MainListResponseItem[];
  totalPages: number;
  currentPage: number;
}

const ITEMS_PER_PAGE = 4; // 각 카테고리당 아이템 수

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // 인기 뉴스 (조회수 기준)
    const popularNews = await prisma.news.findMany({
      orderBy: {
        views: "desc",
      },
      take: ITEMS_PER_PAGE,
      skip: skip,
    });

    // K-pop 뉴스
    const kpopNews = await prisma.news.findMany({
      where: {
        category: "K-POP",
      },
      take: ITEMS_PER_PAGE,
      skip: skip,
    });

    // 주요 뉴스 (최신순)
    const mainNews = await prisma.news.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: ITEMS_PER_PAGE,
      skip: skip,
    });

    // AI 뉴스
    const aiNews = await prisma.news.findMany({
      where: {
        category: "AI",
      },
      take: ITEMS_PER_PAGE,
      skip: skip,
    });

    // 전체 페이지 수 계산을 위한 총 뉴스 수 조회
    const totalNewsCount = await prisma.news.count();
    const totalPages = Math.ceil(totalNewsCount / (ITEMS_PER_PAGE * 4)); // 4는 카테고리 수

    const response: MainListResponse = {
      popularNews: popularNews.map((news) => ({
        id: news.id,
        title: news.title,
        summary: news.summary,
        imageUrl: news.imageUrl,
        category: news.category,
        createdAt: news.createdAt,
      })),
      kpopNews: kpopNews.map((news) => ({
        id: news.id,
        title: news.title,
        summary: news.summary,
        imageUrl: news.imageUrl,
        category: news.category,
        createdAt: news.createdAt,
      })),
      mainNews: mainNews.map((news) => ({
        id: news.id,
        title: news.title,
        summary: news.summary,
        imageUrl: news.imageUrl,
        category: news.category,
        createdAt: news.createdAt,
      })),
      aiNews: aiNews.map((news) => ({
        id: news.id,
        title: news.title,
        summary: news.summary,
        imageUrl: news.imageUrl,
        category: news.category,
        createdAt: news.createdAt,
      })),
      totalPages,
      currentPage: page,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("페이지네이션 API 에러:", error);
    return NextResponse.json(
      { error: "뉴스를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
