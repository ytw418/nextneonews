import { NextResponse } from "next/server";
import { chromium, type Page, type ElementHandle } from "@playwright/test";

// 요구사항
// Vercel Hobby 플랜의 최대 실행 시간 제한 (60초)
// 최대 실행 시간 제한 설정
// 60초 이상 실행되면 오류 반환
// CSR 페이지 크롤링 가능하게 만들기
export const maxDuration = 60;

/**
 * NeoNews 웹사이트의 뉴스 데이터를 크롤링하는 API 라우트
 * 특정 포스트 페이지를 크롤링하여 제목, 내용, 태그 등의 정보를 추출
 *
 * @route GET /api/news/findData
 * @returns {Promise<NextResponse>} 크롤링된 뉴스 데이터 반환
 * - success: 크롤링 성공 여부
 * - count: 수집된 뉴스 아이템 수
 * - data: 뉴스 아이템 배열
 */
export async function GET() {
  // 크롤링 시작 시간 기록 (실행 시간 측정용)
  console.log("📫 NeoNews 크롤링 시작...");
  const startTime = Date.now();

  let browser;
  try {
    // 1. Playwright 브라우저 실행
    console.log("🌐 브라우저 실행 중...");
    browser = await chromium.launch({
      headless: true,
      chromiumSandbox: false,
    });

    // 2. 브라우저 컨텍스트 및 페이지 생성
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }, // 페이지 뷰포트 설정
      ignoreHTTPSErrors: true, // HTTPS 인증서 오류 무시
    });
    const page = await context.newPage();

    // 3. 대상 페이지 로드
    console.log("🌐 NeoNews 사이트에 접속 시도...");
    await page.goto("https://nextneonews.vercel.app/post/183", {
      waitUntil: "networkidle", // 네트워크 요청이 완료될 때까지 대기 (페이지 완전 로드 보장)
      timeout: 15000, // 15초 타임아웃 (Vercel 제한 고려)
    });

    // 4. 페이지 데이터 추출
    console.log("🔍 뉴스 아이템 추출 중...");

    // 모든 데이터 추출을 병렬로 실행
    const [title, publishedDate, content, tags, imageUrl] = await Promise.all([
      // 4.1 제목 추출
      page.$eval<string, HTMLElement>(
        "h1",
        (el) => el.textContent?.trim() || ""
      ),

      // 4.2 발행일 추출
      page.$eval<string, HTMLElement>(
        "time",
        (el) => el.textContent?.trim() || "2024년 12월 3일"
      ),

      // 4.3 본문 내용 추출
      page.$$eval<string, HTMLElement>("article p, article h2", (elements) =>
        elements
          .map((el) => el.textContent?.trim())
          .filter(Boolean)
          .join("\n\n")
      ),

      // 4.4 해시태그 추출
      page.$$eval<string[], HTMLAnchorElement>('a[href^="#"]', (elements) =>
        elements
          .map((el) => el.textContent?.trim())
          .filter(
            (tag): tag is string =>
              typeof tag === "string" && tag.startsWith("#")
          )
          .map((tag) => tag.substring(1))
      ),

      // 4.5 대표 이미지 URL 추출
      page.$eval<string, HTMLImageElement>(
        'img:not([alt="logo"])',
        (el) => el.getAttribute("src") || ""
      ),
    ]);

    // 4.6 수집된 데이터로 뉴스 아이템 구성
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

    // 5. 실행 시간 계산 및 결과 반환
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
    // 에러 처리 및 로깅
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
    // 브라우저 리소스 정리
    if (browser) {
      await browser.close();
    }
  }
}
