"use client"; // 클라이언트 컴포넌트 선언 (React hooks 사용을 위해 필요)

import Image from "next/image";
import { useState } from "react";

interface NewsImageProps {
  src: string; // 이미지 소스 URL
  alt: string; // 이미지 대체 텍스트 (접근성)
  className?: string; // 추가 스타일링을 위한 선택적 클래스
}

export const NewsImage = ({ src, alt, className = "" }: NewsImageProps) => {
  // 이미지 로드 실패 상태 관리
  const [error, setError] = useState(false);

  // 이미지 로드 실패시 사용할 대체 이미지 경로
  const fallbackImage = "/images/haci.webp";

  // 이미지 로드 실패 핸들러
  const handleImageError = () => {
    console.log("이미지 로드 실패:", src);
    setError(true);
  };

  return (
    // 16:9 비율을 유지하는 컨테이너
    <div className="relative aspect-[16/9]">
      <Image
        src={error ? fallbackImage : src} // 에러 상태에 따라 이미지 소스 전환
        alt={alt} // 접근성을 위한 대체 텍스트
        fill // 부모 요소 크기에 맞춰 이미지 채우기
        sizes="(max-width: 640px) 100vw,   // 반응형 이미지 크기 최적화
               (max-width: 1080px) 50vw,   // - 모바일: 전체 너비
               33vw" // - 태블릿: 절반 너비
        // - 데스크톱: 1/3 너비
        quality={75} // 이미지 품질 설정 (최적화)
        loading="lazy" // 지연 로딩 (성능 최적화)
        className={`object-cover rounded-lg ${className}`} // 추가 클래스 적용
        onError={handleImageError} // 이미지 로드 실패시 처리
      />
    </div>
  );
};
