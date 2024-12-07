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
  console.log("📫 NeoNews 크롤링 시작...");
  const startTime = Date.now();

  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    // 1. 브라우저 실행
    console.log("🌐 브라우저 실행 중...");
    browser = await chromium.launch({
      headless: true,
    });

    // 2. 브라우저 컨텍스트 및 페이지 생성
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    // 3. 페이지 로드
    console.log("🌐 NeoNews 사이트에 접속 시도...");
    await page.goto("https://nextneonews.vercel.app/post/183", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 4. 데이터 추출
    console.log("🔍 뉴스 아이템 추출 중...");
    const [title, publishedDate, content, tags, imageUrl] = await Promise.all([
      page.$eval<string, HTMLElement>(
        "h1",
        (el) => el.textContent?.trim() || ""
      ),
      page.$eval<string, HTMLElement>(
        "time",
        (el) => el.textContent?.trim() || "2024년 12월 3일"
      ),
      page.$$eval<string, HTMLElement>("article p, article h2", (elements) =>
        elements
          .map((el) => el.textContent?.trim())
          .filter(Boolean)
          .join("\n\n")
      ),
      page.$$eval<string[], HTMLAnchorElement>('a[href^="#"]', (elements) =>
        elements
          .map((el) => el.textContent?.trim())
          .filter(
            (tag): tag is string =>
              typeof tag === "string" && tag.startsWith("#")
          )
          .map((tag) => tag.substring(1))
      ),
      page.$eval<string, HTMLImageElement>(
        'img:not([alt="logo"])',
        (el) => el.getAttribute("src") || ""
      ),
    ]);

    const newsItems: NewsItem[] = [
      {
        title,
        summary: content.substring(0, 200) + "...",
        content,
        imageUrl,
        originalUrl: "https://nextneonews.vercel.app/post/183",
        author: "NeoNews",
        publishedAt: publishedDate,
        category: "뉴스",
        tags,
      },
    ];

    const executionTime = Date.now() - startTime;
    console.log(
      `✅ 크롤링 완료! 총 ${newsItems.length}개의 뉴스 수집 (${executionTime}ms)`
    );

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
