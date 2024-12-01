import { prisma } from "@/libs/prisma";
import { NextResponse } from "next/server";

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

    return NextResponse.json(kpopNews);
  } catch (error) {
    console.error("K-pop news fetch error:", error);
    return NextResponse.json(
      { error: "뉴스를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
