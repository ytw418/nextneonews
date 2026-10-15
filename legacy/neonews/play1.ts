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

async function getKagitArticleDetail(url: string): Promise<NewsData[]> {
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

      return extractedTags.length > 0 ? extractedTags : ["K-POP", "연"]; // 기본 태그 배열 반환
    });

    // NewsData 형식으로 변환
    const newsData: NewsData[] = [
      {
        title,
        summary: content.substring(0, 200) + "...",
        content,
        imageUrl: imageUrl || "",
        category: "MAIN",
        tags: tags,
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

async function crawlKagitList(url: string): Promise<NewsData[]> {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    console.log("🌐 브라우저 시작...");
    browser = await chromium.launch({
      headless: true,
    });

    context = await browser.newContext({
      viewport: { width: 700, height: 3000 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    console.log("📄 메인 페이지 로드 시작...");

    // 메인 페이지 접속
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // 페이지 로딩 후 추가 대기
    await page.waitForLoadState("load", { timeout: 30000 });
    await page.waitForTimeout(2000); // 2초 추가 대기

    // 게시글 링크 수집 - 처음 10개만
    const links = await page.evaluate(() => {
      const articleLinks = Array.from(
        document.querySelectorAll(
          "div.pb-12.px-2.mx-auto.max-w-\\[1150px\\].w-full.space-y-6 div.space-y-3 > a"
        )
      );

      console.log("Found links:", articleLinks.length);

      return articleLinks
        .map((link) => {
          const href = link.getAttribute("href");
          console.log("Link href:", href);
          return href;
        })
        .filter((href): href is string => !!href && href.startsWith("/posts/"))
        .slice(0, 100); // 처음 10개만 선택
    });

    console.log(
      `🔍 총 ${links.length}개의 게시글 링크 발견 (최대 10개):`,
      links
    );

    // 각 링크별로 크롤링 (최대 10개)
    const allNewsData: NewsData[] = [];
    for (const link of links) {
      try {
        const fullUrl = `https://www.kagit.kr${link}`;
        console.log(
          `\n🔗 크롤링 시작 (${allNewsData.length + 1}/10): ${fullUrl}`
        );
        const newsItems = await getKagitArticleDetail(fullUrl);
        allNewsData.push(...newsItems);

        // 과도한 요청 방지를 위한 딜레이
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ 게시글 크롤링 실패: ${link}`, error);
        continue;
      }
    }

    console.log(
      `\n✅ 전체 크롤링 완료. 총 ${allNewsData.length}개의 뉴스 수집`
    );
    return allNewsData;
  } catch (error) {
    console.error("❌ 크롤링 중 오류 발생:", error);
    throw error;
  } finally {
    await context?.close();
    await browser?.close();
  }
}

// 메인 함수 수정
async function main() {
  try {
    // 뉴스 데이터 수집
    const allNews = await crawlKagitList("https://www.kagit.kr/?categoryId=7");
    console.log("크롤링 결과:", allNews);

    // makeList API로 뉴스 일괄 생성
    const response = await fetch("http://localhost:3000/api/news/makeList", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(allNews),
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response}`);
    }

    const result = await response.json();
    console.log("뉴스 생성 결과:", result);
    console.log(`총 ${result.count}개의 뉴스가 생성되었습니다.`);
  } catch (error) {
    console.error("메인 프로세스 오류:", JSON.stringify(error));
  }
}

// 크립트가 직접 실행될 때만 main 함수 실행
if (require.main === module) {
  main();
}

// 내보내기
export { getKagitArticleDetail, crawlKagitList, main };
