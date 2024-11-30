import { http, HttpResponse } from "msw";
import { mainNews, kpopNews, mainSlides } from "@/mocks/data/news";
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
];
