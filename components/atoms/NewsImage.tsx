"use client";

import Image from "next/image";

interface NewsImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const NewsImage = ({ src, alt, className = "" }: NewsImageProps) => {
  return (
    <div className="relative aspect-[16/9]">
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover rounded-lg ${className}`}
      />
    </div>
  );
};
