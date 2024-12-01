import { Metadata } from "next";
import PostClient from "./PostClient";
import { notFound } from "next/navigation";
import { createSlugUrl } from "@/libs/utils/utils";
import { prisma } from "@/libs/prisma";

interface PostPageProps {
  params: {
    id: string;
  };
}

// 빌드 시 생성할 페이지의 params 생성
export async function generateStaticParams() {
  try {
    // 빌드 시에는 직접 DB 조회
    const allNews = await prisma.news.findMany({
      where: {
        OR: [
          { category: { not: "K-POP" } }, // 메인 뉴스
          { category: "K-POP" }, // K-POP 뉴스
        ],
      },
      select: {
        id: true,
        title: true,
      },
    });

    return allNews.map((news) => ({
      id: createSlugUrl(news.id, news.title),
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// 메타데이터 생성도 DB에서 직접 조회
export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const id = params.id.split("-")[0];

  try {
    const post = await prisma.news.findUnique({
      where: { id: parseInt(id) },
    });

    if (!post) {
      return {
        title: "Not Found",
        description: "페이지를 찾을 수 없습니다.",
      };
    }

    return {
      title: post.title,
      description: post.summary,
      keywords: post.tags,
      openGraph: {
        title: post.title,
        description: post.summary,
        images: [post.imageUrl],
      },
    };
  } catch (error) {
    return {
      title: "Not Found",
      description: "페이지를 찾을 수 없습니다.",
    };
  }
}

// 페이지 컴포넌트도 DB에서 직접 조회
export default async function PostPage({ params }: PostPageProps) {
  const id = params.id.split("-")[0];

  try {
    const newsItem = await prisma.news.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!newsItem) {
      notFound();
    }

    const relatedNews = await prisma.news.findMany({
      where: {
        AND: [{ category: newsItem.category }, { id: { not: newsItem.id } }],
      },
      take: 3,
      orderBy: {
        createdAt: "desc",
      },
    });

    const postDetail = {
      ...newsItem,
      createdAt: newsItem.createdAt.toISOString(),
      updatedAt: newsItem.updatedAt.toISOString(),
      relatedNews: relatedNews.map((news) => ({
        ...news,
        createdAt: news.createdAt.toISOString(),
      })),
    };

    return <PostClient post={postDetail} />;
  } catch (error) {
    notFound();
  }
}
