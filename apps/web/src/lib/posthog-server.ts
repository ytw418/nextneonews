import { waitUntil } from "@vercel/functions";
import type { Instrumentation } from "next";
import { PostHog } from "posthog-node";

// 서버 에러(화면 그리기·API·서버 액션·proxy)를 PostHog 에러 추적으로 보낸다. instrumentation.ts 의 onRequestError 가 부른다.
// 브라우저 에러는 lib/posthog.ts 가 보낸다

// 같은 화면에서 같은 에러가 이 시간 안에 또 나면 보내지 않는다. DB 가 내려가면 거의 모든 요청이 실패해서(docs/predeploy/db-outage-500.md)
// 그대로 보내면 에러 추적 무료 한도(월 10만 건)를 몇 시간 만에 쓴다. 함수 인스턴스마다 따로 센다
const REPEAT_MS = 10 * 60_000;
const MAX_KEYS = 200;
const lastSent = new Map<string, number>();

let client: PostHog | null = null;

export function shouldSend(key: string, now: number): boolean {
  const last = lastSent.get(key);
  if (last !== undefined && now - last < REPEAT_MS) return false;
  lastSent.delete(key);
  lastSent.set(key, now);
  if (lastSent.size > MAX_KEYS) lastSent.delete(lastSent.keys().next().value as string);
  return true;
}

export async function captureRequestError(
  token: string,
  ...[error, request, context]: Parameters<Instrumentation.onRequestError>
): Promise<void> {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  // Next 는 화면 하나의 에러를 서버 컴포넌트(…/[slug])와 HTML 그리기(…/[slug]/page)에서 두 번 넘긴다 — 한 번으로 센다
  const route = context.routePath.replace(/\/page$/, "");
  if (!shouldSend(`${route} ${message}`, Date.now())) return;

  client ??= new PostHog(token, { host: "https://us.i.posthog.com", flushAt: 1, flushInterval: 0 });
  // 주소의 쿼리는 빼고, 요청 헤더(쿠키·IP)는 보내지 않는다. 방문자 구분 없이(사람 프로필을 만들지 않고) 보낸다
  const pathname = request.path.split("?")[0];
  const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;
  const sent = client
    .captureExceptionImmediate(error, undefined, {
      $current_url: `${process.env.SITE_URL ?? ""}${pathname}`,
      $pathname: pathname,
      method: request.method,
      route_path: context.routePath,
      route_type: context.routeType,
      render_source: context.renderSource,
      revalidate_reason: context.revalidateReason,
      digest,
    })
    .catch(() => {
      // PostHog 가 안 받아도 원래 에러 처리(오류 화면)는 그대로 간다
    });
  // 화면 그리기 에러는 Next 가 이 함수를 기다리지 않고 응답을 끝낸다. 보내는 동안 함수가 멈추지 않게 Vercel 에 알린다
  waitUntil(sent);
  await sent;
}
