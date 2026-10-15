import { MetadataRoute } from 'next'

// robots.txt 설정
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  return {
    // 기본 규칙
    rules: {
      userAgent: '*',
      allow: '/',      // 모든 경로 허용
      disallow: [      // 크롤링 제외할 경로들
        '/api/',       // API 경로 제외
        '/admin/',     // 관리자 페이지 제외
        '/private/',   // 비공개 페이지 제외
        '/*.json',     // JSON 파일 제외
      ],
    },
    // 사이트맵 위치 지정
    sitemap: `${baseUrl}/sitemap.xml`,
    // 호스트 지정
    host: baseUrl,
  }
} 