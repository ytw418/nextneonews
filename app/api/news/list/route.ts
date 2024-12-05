import { prisma } from "@/libs/prisma";
import { NextRequest, NextResponse } from "next/server";

export type NewsListResponse = {
  items: {
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
  }[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터 파싱
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "12");
    const sortBy = searchParams.get("sortBy") || "createdAt"; // createdAt, views
    const order = searchParams.get("order") || "desc"; // asc, desc

    // 필터 조건 구성
    const where = category ? { category } : {};

    // 정렬 조건 구성
    const orderBy: any = {};
    orderBy[sortBy] = order;

    // 전체 아이템 수 조회
    const total = await prisma.news.count({ where });

    // 페이지네이션 적용하여 데이터 조회
    const items = await prisma.news.findMany({
      where,
      orderBy,
      skip: (page - 1) * size,
      take: size,
    });

    // 응답 데이터 포맷팅
    const formattedItems = items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    const response: NewsListResponse = {
      items: formattedItems,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      { error: "뉴스를 불러오는데 실패하였습니다." },
      { status: 500 }
    );
  }
}
