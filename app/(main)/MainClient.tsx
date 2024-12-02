"use client";

import type { NewsCardProps } from "@/components/common/NewsCard";
import { NewsSection } from "@/components/common/NewsSection";
import type { SlideItem } from "@/mocks/data/news";
import Image from "next/image";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import useSWR from "swr";

// 슬라이더 설정
const sliderSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 5000,
  arrows: false,
  responsive: [
    {
      breakpoint: 768,
      settings: {
        arrows: false,
        dots: true,
      },
    },
  ],
};

interface MainClientProps {
  initialData: {
    [key: string]: any;
  };
}

const MainClient = ({ initialData }: MainClientProps) => {
  // SWR 훅은 전달받은 initialData를 사용
  const { data: mainNews } = useSWR<NewsCardProps[]>("/api/news/main", {
    fallbackData: initialData["/api/news/main"],
  });
  const { data: kpopNews } = useSWR<NewsCardProps[]>("/api/news/kpop", {
    fallbackData: initialData["/api/news/kpop"],
  });
  const { data: slides } = useSWR<SlideItem[]>("/api/slides", {
    fallbackData: initialData["/api/slides"],
  });

  return (
    <div className="space-y-8">
      {/* 메인 슬라이더 */}
      {slides && slides.length > 0 && (
        <div className="relative">
          <Slider {...sliderSettings}>
            {slides.map((slide) => (
              <div key={slide.id} className="relative h-[300px] sm:h-[400px]">
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">
                    {slide.title}
                  </h2>
                  <p className="text-sm sm:text-base">{slide.description}</p>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      )}

      {/* 메인 뉴스 섹션 */}
      {mainNews && mainNews.length > 0 && (
        <NewsSection title="주요 뉴스" items={mainNews} />
      )}

      {/* K-POP 뉴스 섹션 */}
      {kpopNews && kpopNews.length > 0 && (
        <NewsSection title="K-POP 뉴스" items={kpopNews} />
      )}
    </div>
  );
};
export default MainClient;
