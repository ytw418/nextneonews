import PostClient from "./PostClient";
import { NewsCardProps } from "@/components/common/NewsCard";

export default async function PostPage({ params }: { params: { id: string } }) {
  try {
    // const post = await getPost(params.id);
    return <PostClient />;
  } catch (error) {
    // console.error("Post page error:", error);
    return <div>포스트를 불러오는 중 오류가 발생했습니다.</div>;
  }
}
