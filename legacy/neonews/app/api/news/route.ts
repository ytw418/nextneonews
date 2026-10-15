import { prisma } from "@/libs/prisma";
import { NextResponse } from "next/server";

// 모든 뉴스 조회
export async function GET() {
  try {
    const news = await prisma.news.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error("뉴스 조회 중 오류 발생:", error);
    return NextResponse.json(
      { error: "뉴스 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 새로운 뉴스 생성
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      summary,
      content,
      imageUrl,
      category,
      tags,
      author,
      source,
    } = body;

    // 필수 필드 검증
    if (!title || !summary || !content || !category) {
      return NextResponse.json(
        { error: "제목, 요약, 내용, 카테고리는 필수입니다." },
        { status: 400 }
      );
    }

    const newNews = await prisma.news.create({
      data: {
        title,
        summary,
        content,
        imageUrl: imageUrl || "",
        category,
        tags: tags || [],
        views: 0,
        author: author || null,
        source: source || null,
      },
    });

    return NextResponse.json(newNews, { status: 201 });
  } catch (error) {
    console.error("뉴스 생성 중 오류 발생:", error);
    return NextResponse.json(
      { error: "뉴스 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
