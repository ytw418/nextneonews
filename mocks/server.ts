import { setupServer } from "msw/node";
import type { HttpHandler } from "msw";
import { handlers } from "./handlers";

export const server = setupServer(...(handlers as HttpHandler[]));

server.events.on("request:start", ({ request }) => {
  console.log("🔍 요청 감지:", request.method, request.url);
});

server.events.on("response:mocked", ({ request, response }) => {
  console.log("✅ 응답 완료:", {
    url: request.url,
    상태: response.status,
    소요시간: "0ms",
  });
});

server.events.on("unhandledException", ({ request, error }) => {
  console.error("❌ 요청 실패:", {
    url: request.url,
    에러: error,
  });
});
