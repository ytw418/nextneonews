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

// 재시도 로직
const retry = async <T>(fn: () => Promise<T>, attempts = 3): Promise<T> => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      console.log(`재시도 중... (${i + 1}/${attempts})`);
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("재시도 실패");
};

// 환경 설정 검증
const validateEnvironment = () => {
  const requiredEnvVars = [
    "PLAYWRIGHT_BROWSERS_PATH",
    "PLAYWRIGHT_SKIP_BROWSER_GC",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`⚠️ ${envVar}가 설정되지 않았습니다.`);
    }
  }
};

export const maxDuration = 60;

export async function GET(): Promise<NextResponse<CrawlResponse>> {
  validateEnvironment();
  console.log("📫 NeoNews 크롤링 시작...");
  const startTime = Date.now();

  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    // 전체 실행 시간 제한
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("크롤링 시간 초과 (58초)")), 58000);
    });

    const crawlingLogic = async () => {
      // 1. Playwright 브라우저 실행
      console.log("🌐 브라우저 실행 중...");
      browser = await chromium.launch({
        headless: true,
        chromiumSandbox: false,
        executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH
          ? `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium/chrome`
          : undefined,
      });

      // 2. 브라우저 컨텍스트 및 페이지 생성
      context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
      });
      const page = await context.newPage();

      // 3. 대상 페이지 로드 (재시도 로직 적용)
      console.log("🌐 NeoNews 사이트에 접속 시도...");
      await retry(async () => {
        await page.goto("https://nextneonews.vercel.app/post/183", {
          waitUntil: "networkidle",
          timeout: 15000,
        });
      });

      // 4. 페이지 데이터 추출
      console.log("🔍 뉴스 아이템 추출 중...");
      const [title, publishedDate, content, tags, imageUrl] = await Promise.all(
        [
          page.$eval<string, HTMLElement>(
            "h1",
            (el) => el.textContent?.trim() || ""
          ),
          page.$eval<string, HTMLElement>(
            "time",
            (el) => el.textContent?.trim() || "2024년 12월 3일"
          ),
          page.$$eval<string, HTMLElement>(
            "article p, article h2",
            (elements) =>
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
        ]
      );

      return { title, publishedDate, content, tags, imageUrl };
    };

    // 크롤링 실행 (타임아웃 적용)
    const data = await Promise.race([crawlingLogic(), timeoutPromise]);

    // 뉴스 아이템 구성
    const newsItems: NewsItem[] = [
      {
        title: data.title,
        summary: data.content.substring(0, 200) + "...",
        content: data.content,
        imageUrl: data.imageUrl,
        originalUrl: "https://nextneonews.vercel.app/post/183",
        author: "NeoNews",
        publishedAt: data.publishedDate,
        category: "뉴스",
        tags: data.tags,
      },
    ];

    // 실행 시간 계산 및 결과 반환
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
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("❌ 크롤링 중 오류 발생:", {
      error: errorMessage,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined,
      executionTime: Date.now() - startTime,
      env: {
        PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH,
        NODE_ENV: process.env.NODE_ENV,
      },
    });

    return NextResponse.json(
      {
        success: false,
        count: 0,
        data: [],
        error: "크롤링 중 오류가 발생했습니다.",
        details: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    // 리소스 정리
    await context?.close();
    await browser?.close();
  }
}
