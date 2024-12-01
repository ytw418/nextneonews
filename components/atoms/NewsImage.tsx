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
    setImageSrc("/images/haci.png");
  };

  return (
    <div className="relative aspect-[16/9]">
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, 
               (max-width: 1080px) 50vw, 
               33vw"
        quality={75}
        loading="lazy"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        className={`object-cover rounded-lg ${className}`}
        onError={handleError}
      />
    </div>
  );
};
