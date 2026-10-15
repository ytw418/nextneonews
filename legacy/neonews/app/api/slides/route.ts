import { prisma } from "@/libs/prisma";
import { NextResponse } from "next/server";

export type SlideResponse = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  tags: string[];
}[];

export async function GET() {
  try {
    const slides = await prisma.slide.findMany();
    return NextResponse.json(slides);
  } catch (error) {
    console.error("Slides fetch error:", error);
    return NextResponse.json(
      { error: "슬라이드 데이터를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
