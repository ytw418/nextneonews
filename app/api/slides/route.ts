import { mainSlides } from "@/mocks/data/news";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(mainSlides);
  } catch (error) {
    console.error("Slides fetch error:", error);
    return NextResponse.json(
      { error: "슬라이드 데이터를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
