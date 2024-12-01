import { Metadata } from "next";
import PostClient from "./PostClient";
import { getPostDetail, getMainNews, getKpopNews } from "@/libs/utils/api";
import { notFound } from "next/navigation";
import { createSlugUrl } from "@/libs/utils/utils";

interface PostPageProps {
  params: {
    id: string;
  };
}

// 빌드 시 생성할 페이지의 params 생성
export async function generateStaticParams() {
  // 모든 뉴스 데이터 가져오기
  const [mainNews, kpopNews] = await Promise.all([
    getMainNews(),
    getKpopNews(),
  ]).catch((error) => {
    console.error("Error generating static params:", error);
    return [];
  });

  // 모든 뉴스의 ID와 제목으로 slug 생성
  const allNews = [...mainNews, ...kpopNews];

  return allNews.map((news) => ({
    id: createSlugUrl(news.id, news.title),
  }));
}

// 동적 메타데이터 생성
export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const id = params.id.split("-")[0];
  console.log("generateMetadata params :>> ", params);

  try {
    const post = await getPostDetail(id);

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

export default async function PostPage({ params }: PostPageProps) {
  const id = params.id.split("-")[0];

  try {
    const postDetail = await getPostDetail(id);
    return <PostClient post={postDetail} />;
  } catch (error) {
    notFound();
  }
}
