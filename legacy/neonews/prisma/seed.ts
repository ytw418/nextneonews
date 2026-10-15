import { PrismaClient } from "@prisma/client";
import { mainNews, kpopNews, mainSlides } from "../mocks/data/news";
import { Category } from "@/types/news";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🗑️ Cleaning up existing data...");
    await prisma.news.deleteMany();
    await prisma.slide.deleteMany();

    console.log("📰 Seeding news data...");
    // 메인 뉴스 데이터 시딩
    for (const news of mainNews) {
      await prisma.news.create({
        data: {
          title: news.title,
          summary: news.summary,
          content: news.content || `${news.title}에 대한 상세 내용입니다.`,
          imageUrl: news.imageUrl,
          category: news.category as Category,
          tags: news.tags,
          views: 0,
          author: "NeoNews 기자",
          source: "NeoNews",
          language: "ko",
        },
      });
    }

    // K-POP 뉴스 데이터 시딩
    for (const news of kpopNews) {
      await prisma.news.create({
        data: {
          title: news.title,
          summary: news.summary,
          content: news.content || `${news.title}에 대한 상세 내용입니다.`,
          imageUrl: news.imageUrl,
          category: news.category as Category,
          tags: news.tags,
          views: 0,
          author: "NeoNews K-POP 기자",
          source: "NeoNews",
          language: "ko",
        },
      });
    }

    console.log("🎯 Seeding slides data...");
    for (const slide of mainSlides) {
      await prisma.slide.create({
        data: {
          title: slide.title,
          description: slide.description,
          imageUrl: slide.imageUrl,
          category: slide.category as Category,
          tags: slide.tags,
        },
      });
    }

    console.log("✅ Seed data inserted successfully");
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
