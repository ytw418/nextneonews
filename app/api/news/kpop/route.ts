import { kpopNews } from "@/mocks/data/news";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(kpopNews);
  } catch (error) {
    console.error("Kpop news fetch error:", error);
    return NextResponse.json(
      { error: "K-POP 뉴스를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
