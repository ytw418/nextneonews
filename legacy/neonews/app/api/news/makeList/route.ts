import { prisma } from "@/libs/prisma";
import { validateNewsData } from "@/utils/validateNews";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const newsItems = await req.json();

    if (!Array.isArray(newsItems)) {
      return NextResponse.json(
        { error: "뉴스 데이터는 배열 형태여야 합니다." },
        { status: 400 }
      );
    }

    // 모든 source 값을 배열로 추출
    const sources = newsItems.map((news) => news.source).filter(Boolean);

    // source 값들로 한 번에 검색
    const existingNews = await prisma.news.findMany({
      where: {
        source: {
          in: sources,
        },
      },
      select: { source: true },
    });

    // 이미 존재하는 source 집합 생성
    const existingSources = new Set(existingNews.map((news) => news.source));

    // 중복되지 않고 유효한 뉴스만 필터링
    const validNewsItems = newsItems.filter(
      (news) =>
        news.source &&
        !existingSources.has(news.source) &&
        validateNewsData(news)
    );

    if (validNewsItems.length === 0) {
      return NextResponse.json(
        { error: "유효한 새로운 뉴스가 없습니다." },
        { status: 400 }
      );
    }

    // 뉴스 일괄 생성
    const createdNews = await prisma.news.createMany({
      data: validNewsItems.map((news) => ({
        title: news.title,
        content: news.content,
        summary: news.summary,
        imageUrl: news.imageUrl,
        category: news.category,
        tags: news.tags,
        source: news.source,
        author: news.author,
        views: 0,
        language: "ko", // 기본값 설정
      })),
    });

    return NextResponse.json({
      success: true,
      count: createdNews.count,
      message: `${createdNews.count}개의 뉴스가 생성되었습니다.`,
    });
  } catch (error) {
    console.error("뉴스 일괄 생성 중 오류:", error);
    return NextResponse.json(
      { error: "뉴스 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
