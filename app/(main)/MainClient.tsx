"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Slider from "react-slick";
import { NewsSection } from "@/components/common/NewsSection";
import type { NewsCardProps } from "@/components/common/NewsCard";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface SlideItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
}

const MainClient = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [news, setNews] = useState<NewsCardProps[]>([]);
  const [kpopNews, setKpopNews] = useState<NewsCardProps[]>([]);
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    beforeChange: () => setIsDragging(true),
    afterChange: () => setIsDragging(false),
  };

  const handleSlideClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDragging) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [slidesRes, newsRes, kpopRes] = await Promise.all([
          fetch("/api/slides"),
          fetch("/api/news/main"),
          fetch("/api/news/kpop"),
        ]);

        if (!slidesRes.ok || !newsRes.ok || !kpopRes.ok) {
          throw new Error("데이터 로딩에 실패했습니다");
        }

        const [slidesData, newsData, kpopData] = await Promise.all([
          slidesRes.json(),
          newsRes.json(),
          kpopRes.json(),
        ]);

        setSlides(slidesData);
        setNews(newsData);
        setKpopNews(kpopData);
        setIsLoading(false);
      } catch (error) {
        console.error("데이터 로딩 중 오류 발생:", error);
        setIsLoading(false);
      }
    };
  }, []);

  if (isLoading) {
    return <NewsSkeletonList data-testid="skeleton-loader" />;
  }

  return (
    <div className="pb-6">
      {/* 메인 슬라이더 */}
      <div className="mb-8">
        <Slider {...sliderSettings}>
          {slides.map((slide) => (
            <Link
              href={`/post/${slide.id}`}
              key={slide.id}
              onClick={handleSlideClick}
              className="cursor-pointer"
            >
              <div className="relative h-[280px] sm:h-[320px]">
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <div className="container-custom">
                    <h2 className="text-white text-2xl font-bold mb-2">
                      {slide.title}
                    </h2>
                    <p className="text-white/90 text-sm">{slide.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </Slider>
      </div>

      {/* 주요 뉴스 섹션 */}
      <div className="mb-12">
        <NewsSection title="주요 뉴스" items={news} />
      </div>

      {/* K-POP 뉴스 섹션 */}
      <div>
        <NewsSection title="실시간 인기 K-POP 소식" items={kpopNews} />
      </div>
    </div>
  );
};

const NewsSkeletonList = () => {
  return (
    <div className="container-custom py-6">
      <div className="h-8 w-32 bg-gray-200 rounded mb-6 animate-pulse" />
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="news-card h-full">
            <div className="relative aspect-[16/9] mb-2 sm:mb-4 bg-gray-200 rounded-lg animate-pulse" />
            <div className="space-y-2 sm:space-y-3">
              <div className="h-4 sm:h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-2 sm:h-4 w-16 sm:w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainClient;
