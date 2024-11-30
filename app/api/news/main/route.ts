import { mainNews } from "@/mocks/data/news";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(mainNews);
  } catch (error) {
    console.error("Main news fetch error:", error);
    return NextResponse.json(
      { error: "뉴스를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
