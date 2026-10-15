import React from "react";
import type { SlideItem } from "@/mocks/data/news";
import Slider from "react-slick";
import Image from "next/image";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const SliderSection = ({ slides }: { slides: SlideItem[] }) => {
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
  return (
    <>
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
    </>
  );
};

export default SliderSection;
