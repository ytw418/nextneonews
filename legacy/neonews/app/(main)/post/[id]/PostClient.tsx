"use client";

import { PostDetail } from "@/app/api/posts/[id]/route";
import { NewsSection } from "@/components/common/NewsSection";
import { Button } from "@/components/ui/button";
import { Heart, Share2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { ContentRenderer } from "@/components/common/ContentRenderer";

interface PostClientProps {
  post: PostDetail;
}

const PostClient = ({ post }: PostClientProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const MAX_DAILY_GENERATIONS = 10;

  const handleShare = async () => {
    const currentUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.summary,
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
      isLiked ? "좋아요가 취소되었습니다." : "좋아요를 눌렀습니다.",
      {
        duration: 1000,
        style: {
          background: isLiked ? "#f3f4f6" : "#0064ff",
          color: isLiked ? "#374151" : "#ffffff",
        },
      }
    );
  };

  const handleGenerateNews = async () => {
    if (todayCount >= MAX_DAILY_GENERATIONS) {
      toast.error(`일일 생성 한도(${MAX_DAILY_GENERATIONS}회)를 초과했습니다.`);
      return;
    }

    if (isGenerating) {
      toast.error("이미 뉴스를 생성하고 있습니다.");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("AI가 새로운 뉴스를 생성하고 있습니다...");

    try {
      const response = await fetch("/api/news/aiNews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "뉴스 생성에 실패했습니다.");
      }

      toast.success(`${data.count}개의 다국어 뉴스가 생성되었습니다!`, {
        id: toastId,
      });
      setTodayCount((prev) => prev + 1);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "뉴스 생성 중 오류가 발생했습니다.",
        { id: toastId }
      );
      console.error("뉴스 생성 오류:", error);
    } finally {
      setIsGenerating(false);
    }
  };

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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            {post.title}
          </h1>

          {/* 날짜 */}
          <time className="block text-sm">
            {new Date(post.createdAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>

          {/* 컨텐츠 */}
          <div className="mt-6">
            {post.content ? (
              <ContentRenderer content={post.content} />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">{post.summary}</p>
            )}
          </div>

          {/* 태그 */}
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs sm:text-sm px-2 py-1 bg-primary text-white rounded-full hover:bg-primary/80 transition-colors"
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
              <Heart
                className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`}
              />
              {isLiked ? "좋아요 취소" : "좋아요"}
            </Button>
          </div>

          {/* 관련 뉴스 */}
          {post.relatedNews && post.relatedNews.length > 0 && (
            <div className="mt-8">
              <NewsSection title="관련 뉴스" items={post.relatedNews} />
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleGenerateNews}
              disabled={isGenerating}
              className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors ${
                isGenerating ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isGenerating ? "생성 중..." : "AI 뉴스 생성하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostClient;
