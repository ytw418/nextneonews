"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { NewsSection } from "@/components/common/NewsSection";
import { PostDetail } from "@/app/api/posts/[id]/route";
import { toast } from "sonner";
import { Share2, Heart } from "lucide-react";
import LoadingSpinner from "./loading";

interface PostClientProps {
  post?: PostDetail;
}

const PostClient = ({ post: initialPost }: PostClientProps) => {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const id = window.location.pathname.split("/").pop();

        const response = await fetch(`/api/posts/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch post");
        }

        const data = await response.json();
        setPost(data);
      } catch (err) {
        console.error("Fetching post failed:", err);
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, []);

  const handleShare = async () => {
    const currentUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.summary,
          url: currentUrl,
        });
      } catch (error) {
        console.error("공유 실패:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(currentUrl);
        toast.success("링크가 클립보드에 복사되었습니다.");
      } catch (error) {
        console.error("클립보드 복사 실패:", error);
        toast.error("링크 복사에 실패했습니다.");
      }
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(
      isLiked ? "좋아요가 취소되었습니다." : "좋아요를 눌렀습니다."
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading post</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <div className="min-h-screen pb-20">
      {/* 헤더 이미지 */}
      <div className="relative h-[280px] sm:h-[400px] mb-6">
        <Image
          src={post.imageUrl}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="container-custom">
        <div className="space-y-6">
          {/* 제목 */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            {post.title}
          </h1>

          {/* 날짜 */}
          <time className="block text-sm text-white/70">
            {new Date(post.date).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>

          {/* 컨텐츠 */}
          <div className="prose dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: post.content! }} />
          </div>

          {/* 태그 */}
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs sm:text-sm px-2 py-1 bg-primary/90 text-white rounded-full hover:bg-primary transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* 공유하기와 좋아요 버튼 */}
          <div className="flex gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              공유하기
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLike}
              className={isLiked ? "text-red-500" : ""}
            >
              <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
              {isLiked ? "좋아요 취소" : "좋아요"}
            </Button>
          </div>

          {/* 관련 뉴스 */}
          {post.relatedNews && post.relatedNews.length > 0 && (
            <div className="mt-8">
              <NewsSection title="관련 뉴스" items={post.relatedNews} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostClient;
