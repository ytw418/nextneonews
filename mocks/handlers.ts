import { http, HttpResponse } from "msw";
import { mainNews, kpopNews, mainSlides } from "@/mocks/data/news";
import type { PostDetailProps } from "@/app/(main)/post/[id]/PostClient";

// MSW 핸들러 정의
// 실제 API 엔드포인트를 흉내내는 mock 핸들러들입니다.
export const handlers = [
  http.get("/api/news/main", () => {
    return HttpResponse.json(mainNews);
  }),

  http.get("/api/news/kpop", () => {
    return HttpResponse.json(kpopNews);
  }),

  http.get("/api/slides", () => {
    return HttpResponse.json(mainSlides);
  }),

  // 포스트 상세 조회 API 추가
  http.get("/api/posts/:id", ({ params }) => {
    const id = Number(params.id);

    // mainNews와 kpopNews에서 해당 id의 뉴스 찾기
    const news = {
      id: 1,
      title: "르세라핌, 신곡 'EASY' 글로벌 차트 석권",
      summary: "르세라핌의 새 싱글이 아이튠즈 차트 정상에 올랐습니다.",
      date: "2024.03.20",
      imageUrl: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1",
      category: "K-POP",
      tags: ["르세라핌", "EASY", "걸그룹", "하이브", "컴백", "글로벌"],
    };

    if (!news) {
      // return new HttpResponse(news, { status: 400 });
    }

    // PostDetailProps 형태로 변환
    const post: PostDetailProps = {
      ...news,
      content: news.summary, // 간단한 요약만 포함
      relatedNews: [...mainNews, ...kpopNews]
        .filter(
          (item) =>
            item.id !== id &&
            (item.category === news.category ||
              item.tags.some((tag) => news.tags.includes(tag)))
        )
        .slice(0, 4),
    };

    return HttpResponse.json(post);
  }),
];
