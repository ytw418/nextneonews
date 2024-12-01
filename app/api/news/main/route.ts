import { prisma } from "@/libs/prisma";
import { NextResponse } from "next/server";

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

    return NextResponse.json(mainNews);
  } catch (error) {
    console.error("Main news fetch error:", error);
    return NextResponse.json(
      { error: "뉴스를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
