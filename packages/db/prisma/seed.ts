// 로컬 화면 확인용 샘플 글 1편 (4개 언어). 실제 콘텐츠가 아니다.
import { prisma } from "../src/index";

const SAMPLE_ID = "sample-welcome";

const translations = [
  {
    locale: "en",
    slug: "welcome-sample",
    title: "[Sample] Welcome to Hallyu Brief",
    summary: "A placeholder article to check that the multilingual pages render.",
    body: "This is **sample content** for local development.\n\n## For foreigners\n\nReal articles will include an official source link and FAQ.",
  },
  {
    locale: "ja",
    slug: "welcome-sample",
    title: "[サンプル] Hallyu Brief へようこそ",
    summary: "多言語ページの表示確認用のサンプル記事です。",
    body: "これはローカル開発用の**サンプル**です。\n\n## 外国人の方へ\n\n実際の記事には公式ソースとFAQが付きます。",
  },
  {
    locale: "zh-TW",
    slug: "welcome-sample",
    title: "[範例] 歡迎來到 Hallyu Brief",
    summary: "用來確認多語系頁面顯示的範例文章。",
    body: "這是本地開發用的**範例內容**。\n\n## 給外國人\n\n正式文章會附上官方來源與 FAQ。",
  },
  {
    locale: "ko",
    slug: "welcome-sample",
    title: "[샘플] Hallyu Brief에 오신 것을 환영합니다",
    summary: "다국어 페이지 표시를 확인하기 위한 샘플 글입니다.",
    body: "로컬 개발용 **샘플**입니다.\n\n## 외국인이라면\n\n실제 글에는 공식 출처 링크와 FAQ가 붙습니다.",
  },
];

async function main() {
  await prisma.article.upsert({
    where: { id: SAMPLE_ID },
    update: {},
    create: {
      id: SAMPLE_ID,
      category: "LIFE",
      format: "GUIDE",
      riskTier: "GREEN",
      status: "PUBLISHED",
      publishedAt: new Date(),
      translations: { create: translations },
      sources: {
        create: [{ url: "https://example.com", publisher: "Example", kind: "OFFICIAL" }],
      },
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
