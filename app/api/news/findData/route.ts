import { NextResponse } from "next/server";
import { chromium, type Browser, type BrowserContext } from "@playwright/test";

// 타입 정의
interface NewsItem {
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  originalUrl: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
}

interface CrawlResponse {
  success: boolean;
  count: number;
  data: NewsItem[];
  executionTime?: number;
}

export async function GET(): Promise<NextResponse<CrawlResponse>> {
  console.log("📫 네이버 뉴스 크롤링 시작...");
  const startTime = Date.now();

  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    console.log("🌐 브라우저 시작...");
    browser = await chromium.launch({
      headless: true,
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    console.log("�� 페이지 생성 완료");

    // 페이지 로드 전 로그
    console.log("🌍 페이지 로드 시작...");
    await page.goto("https://m.entertain.naver.com/article/312/0000691967", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 특정 요소가 로드될 때까지 명시적으로 대기
    console.log("⌛ 본문 콘텐츠 대기 중...");
    await page.waitForSelector("span.article_p", {
      state: "attached",
      timeout: 10000,
    });
    console.log("✅ 본문 콘텐츠 로드됨");

    // �목 추출 추가
    const title = await page.evaluate(() => {
      const titleElement = document.querySelector(".end_tit");
      return titleElement?.textContent?.trim() || "제목 없음";
    });

    console.log("📑 추출된 제목:", title);

    // 본문 내용 추출
    const content = await page.evaluate(() => {
      const paragraphs = Array.from(
        document.querySelectorAll("span.article_p")
      );

      return paragraphs
        .map((p) => p.textContent?.trim())
        .filter((text) => text && !text.startsWith("["))
        .join("\n\n");
    });

    console.log("📝 추출된 본문 길이:", content.length);
    if (content.length > 0) {
      console.log("📝 본문 미리보기:", content.substring(0, 100));
    } else {
      console.warn("⚠️ 본문이 비어있습니다!");
    }

    const imageUrl = await page.evaluate(() => {
      const img = document.querySelector(".NewsEndMain_image_wrap__djL-o img");
      return img?.getAttribute("src") || "";
    });
    // console.log("이미지 URL 추출 완료:", imageUrl.substring(0, 30));

    // 현재 날짜를 YYYY년 MM월 DD일 형식으로 변환
    const now = new Date();
    const publishedDate = `${now.getFullYear()}년 ${
      now.getMonth() + 1
    }월 ${now.getDate()}일`;

    const newsItems: NewsItem[] = [
      {
        title,
        summary: content.substring(0, 200) + "...",
        content,
        imageUrl,
        originalUrl: "https://n.news.naver.com/article/312/0000691967",
        author: "네이버뉴스",
        publishedAt: publishedDate,
        category: "연예",
        tags: ["김재중", "편스토랑", "예능"],
      },
    ];

    const executionTime = Date.now() - startTime;
    // console.log(
    //   `✅ 크롤링 완료! 총 ${newsItems.length}개의 뉴스 수집 (${executionTime}ms)`
    // );

    // 디버깅을 위한 데이터 출력
    console.log("수집된 데이터:", {
      title: title.substring(0, 50),
      contentLength: content.length,
      imageUrl: imageUrl.substring(0, 50),
    });

    return NextResponse.json({
      success: true,
      count: newsItems.length,
      data: newsItems,
      executionTime,
    });
  } catch (error) {
    console.error("❌ 크롤링 중 오류 발생:", error);
    return NextResponse.json(
      {
        success: false,
        count: 0,
        data: [],
        error: "크롤링 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  } finally {
    await context?.close();
    await browser?.close();
  }
}
