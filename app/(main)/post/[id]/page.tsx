import type { Metadata } from "next";
import PostClient from "./PostClient";
import { extractIdFromSlug } from "@/libs/utils/utils";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    // utils의 extractIdFromSlug 함수 사용
    const realId = extractIdFromSlug(params.id);
    const post = await fetch(`${baseUrl}/api/posts/${realId}`).then((res) => {
      if (!res.ok) throw new Error("Failed to fetch post");
      return res.json();
    });

    return {
      title: post.title,
      description: post.description,
      openGraph: {
        title: post.title,
        description: post.description,
        images: post.imageUrl
          ? [
              {
                url: post.imageUrl,
                width: 1200,
                height: 630,
                alt: post.title,
              },
            ]
          : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Article Not Found",
      description: "The requested article could not be found.",
    };
  }
}

const Page = () => {
  return (
    <div>
      <PostClient />
    </div>
  );
};

export default Page;
