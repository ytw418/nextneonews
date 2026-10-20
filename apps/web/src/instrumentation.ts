import type { Instrumentation } from "next";

// 서버 에러를 PostHog 에러 추적으로 보낸다 (lib/posthog-server.ts). Next 는 notFound()·redirect() 같은 흐름 제어는 여기로 보내지 않는다.
// 토큰은 운영 배포 빌드에만 들어간다(next.config.ts) — 로컬·미리보기에서는 아무것도 하지 않는다
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  const token = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!token || process.env.NEXT_RUNTIME !== "nodejs") return;
  // 에러가 났을 때만 불러온다 (서버 시작을 무겁게 하지 않는다)
  const { captureRequestError } = await import("@/lib/posthog-server");
  await captureRequestError(token, ...args);
};
