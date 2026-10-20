import { captureErrorPosthog, loadPosthog } from "@/lib/posthog";

// PostHog. 토큰은 운영 배포 빌드에만 들어간다(next.config.ts). 없으면 아무것도 하지 않는다
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// 페이지를 다 받은(load) 뒤 브라우저가 쉴 때 받는다. 쉬는 틈이 이만큼 안 오면 그래도 받는다.
// 이 전에 떠난 방문(대개 1~2초 안의 이탈·봇)은 집계되지 않는다 — 첫 화면 JS 를 줄이는 대가
const IDLE_TIMEOUT_MS = 4000;
// requestIdleCallback 이 없는 사파리: load 직후 하이드레이션·첫 그리기와 겹치지 않게 조금 미룬다
const SAFARI_DELAY_MS = 500;

function whenIdleAfterLoad(load: () => void): void {
  const idle = () =>
    typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback(load, { timeout: IDLE_TIMEOUT_MS })
      : window.setTimeout(load, SAFARI_DELAY_MS);
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
}

if (key) {
  loadPosthog(
    key,
    {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_RELAY,
      ui_host: "https://us.posthog.com",
      defaults: "2026-08-30",
      // 쿠키·로컬 저장소를 쓰지 않는다. 방문자 구분은 PostHog 서버가 IP·브라우저를 날마다 바뀌는 키로 해시해서 한다
      // (프로젝트 설정 'Cookieless server hash mode' 를 켜 둠. 꺼지면 이벤트가 버려진다)
      cookieless_mode: "always",
      // 에러는 아래 리스너가 lib/posthog.ts 로 보낸다(받기 전 에러도 모아 둔다). 켜 두면 프로젝트 설정에 따라 같은 에러가 두 번 간다
      capture_exceptions: false,
    },
    whenIdleAfterLoad,
  );

  // 잡히지 않은 에러 → PostHog 에러 추적. React 가 복구한 에러(하이드레이션 불일치 등)도 Next 가 여기로 올린다.
  // CORS 없이 불러온 다른 출처 스크립트(GA 등)의 에러는 브라우저가 내용을 가려 error 가 비어 온다("Script error."). 고칠 수 없어 보내지 않는다
  window.addEventListener("error", (event) => {
    if (event.error) captureErrorPosthog(event.error);
  });
  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason !== undefined && event.reason !== null) captureErrorPosthog(event.reason);
  });
}
