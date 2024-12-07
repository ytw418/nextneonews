import { chromium, type Browser, type BrowserContext } from "@playwright/test";

interface NewsData {
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  category: string;
  tags: string[];
  views: number;
  author: string | null;
  source: string | null;
}

async function crawlNaverNews(url: string): Promise<NewsData[]> {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    console.log("🌐 브라우저 시작...");
    browser = await chromium.launch({
      headless: true,
    });

    context = await browser.newContext({
      viewport: { width: 700, height: 2020 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    console.log("📄 페이지 생성 완료");

    console.log("🌍 페이지 로드 시작:", url);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // 제목 추출 - 간소화
    console.log("⌛ 제목 요소 대기 중...");
    const title = await page.evaluate(() => {
      return document.querySelector("h1")?.textContent?.trim() || "";
    });

    if (!title) {
      throw new Error("제목을 찾을 수 없습니다");
    }

    // 본문 추출 - 대기 시간 최적화
    console.log("⌛ 본문 요소 대기 중...");
    const content = await page.evaluate(() => {
      const paragraphs = Array.from(
        document.querySelectorAll(".post-paragraph")
      );
      return paragraphs
        .map((p) => p.textContent?.trim())
        .filter((text) => text && !text.startsWith("["))
        .join("\n\n");
    });

    // 이미지 URL 추출 - 간소화
    const imageUrl = await page.evaluate(() => {
      const img = document.querySelector("img.my-4.w-full.rounded-lg");
      return img?.getAttribute("src") || "";
    });

    // 태그 추출 추가
    console.log("⌛ 태그 요소 추출 중...");
    const tags = await page.evaluate(() => {
      const keywordButtons = Array.from(
        document.querySelectorAll(".keyword-btn")
      );
      const extractedTags = keywordButtons
        .map((btn) => btn.textContent?.trim())
        .filter((tag): tag is string => !!tag); // type guard를 사용하여 string[] 타입 보장

      return extractedTags.length > 0 ? extractedTags : ["K-POP", "연예뉴스"]; // 기본 태그 배열 반환
    });

    // NewsData 형식으로 변환
    const newsData: NewsData[] = [
      {
        title,
        summary: content.substring(0, 200) + "...",
        content,
        imageUrl: imageUrl || "",
        category: "K-POP",
        tags: tags, // 이제 항상 string[] 타입
        views: 0,
        author: "KAGIT",
        source: url,
      },
    ];

    console.log("✅ 크롤링 완료:", {
      title: title.substring(0, 50),
      contentLength: content.length,
      imageUrl: imageUrl.substring(0, 50),
      tags: tags, // 태그 정보도 로그에 추가
    });

    return newsData;
  } catch (error) {
    console.error("❌ 크롤링 중 오류 발생:", error);
    throw error;
  } finally {
    await context?.close();
    await browser?.close();
  }
}

// 사용 예시
async function main() {
  try {
    const newsItems = await crawlNaverNews("https://www.kagit.kr/posts/155860");
    console.log("크롤링 결과:", newsItems);

    // API 엔드포인트로 데이터 전송 예시
    // const response = await fetch(
    //   "https://nextneonews.vercel.app" + "/api/news",
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(newsItems[0]),
    //   }
    // );
    // const result = await response.json();
    // console.log("API 응답:", result);
  } catch (error) {
    console.error("메인 프로세스 오류:", error);
  }
}

// 스립트가 직접 실행될 때만 main 함수 실행
if (require.main === module) {
  main();
}

export { crawlNaverNews };
