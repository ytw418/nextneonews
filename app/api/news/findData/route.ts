import { NextResponse } from "next/server";
import { chromium } from "@playwright/test";

export const maxDuration = 300; // 5분 타임아웃 설정 (Vercel Hobby 계정 제한)

/**
 * NeoNews 웹사이트의 뉴스 데이터를 크롤링하는 API 라우트
 * GET /api/news/findData
 * @returns {Promise<NextResponse>} 크롤링된 뉴스 데이터
 */
export async function GET() {
  console.log("📫 NeoNews 크롤링 시작...");
  const startTime = Date.now();

  let browser;
  try {
    // 1. 브라우저 시작
    console.log("🌐 브라우저 실행 중...");
    browser = await chromium.launch({
      headless: true,
      chromiumSandbox: false, // Vercel 환경에서 필요
    });

    // 2. 새 페이지 생성
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    // 3. 페이지 로드 및 대기
    console.log("🌐 NeoNews 사이트에 접속 시도...");
    await page.goto("https://nextneonews.vercel.app/post/183", {
      waitUntil: "networkidle",
      timeout: 30000, // 30초 타임아웃
    });

    // 4. 데이터 추출
    console.log("🔍 뉴스 아이템 추출 중...");

    // h1 태그가 로드될 때까지 대기
    await page.waitForSelector("h1", { timeout: 5000 });

    const title = await page.$eval("h1", (el) => el.textContent?.trim() || "");
    const publishedDate = await page.$eval(
      "time",
      (el) => el.textContent?.trim() || "2024년 12월 3일"
    );

    const content = await page.$$eval("article p, article h2", (elements) =>
      elements
        .map((el) => el.textContent?.trim())
        .filter(Boolean)
        .join("\n\n")
    );

    const tags = await page.$$eval('a[href^="#"]', (elements) =>
      elements
        .map((el) => el.textContent?.trim())
        .filter((tag) => tag?.startsWith("#"))
        .map((tag) => tag?.substring(1))
    );

    const imageUrl = await page.$eval(
      'img:not([alt="logo"])',
      (el) => el.getAttribute("src") || ""
    );

    const newsItems = [
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

    // 5. 결과 반환
    const executionTime = Date.now() - startTime;
    console.log(
      `✅ 크롤링 완료! 총 ${newsItems.length}개의 뉴스 수집 (${executionTime}ms)`
    );

    return NextResponse.json({
      success: true,
      count: newsItems.length,
      data: newsItems,
    });
  } catch (error) {
    // 에러 처리
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("❌ 크롤링 중 오류 발생:", {
      error: errorMessage,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined,
      env: {
        PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH,
        NODE_ENV: process.env.NODE_ENV,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: "크롤링 중 오류가 발생했습니다.",
        details: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
