"use client";

import Image from "next/image";
import { useState } from "react";

interface NewsImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const NewsImage = ({ src, alt, className = "" }: NewsImageProps) => {
  const [imageSrc, setImageSrc] = useState(src);

  const handleError = () => {
    setImageSrc("/images/haci.png"); // 대체 이미지 경로 설정
  };

  return (
    <div className="relative aspect-[16/9]">
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className={`object-cover rounded-lg ${className}`}
        onError={handleError} // 이미지 로드 실패 시 호출
      />
    </div>
  );
};
