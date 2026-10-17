import posthog from "posthog-js";

// PostHog. 토큰은 운영 배포 빌드에만 들어간다(next.config.ts). 없으면 아무것도 하지 않는다
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_RELAY,
    ui_host: "https://us.posthog.com",
    defaults: "2026-08-30",
    // 쿠키·로컬 저장소를 쓰지 않는다. 방문자 구분은 PostHog 서버가 IP·브라우저를 날마다 바뀌는 키로 해시해서 한다
    // (프로젝트 설정 'Cookieless server hash mode' 를 켜 둠. 꺼지면 이벤트가 버려진다)
    cookieless_mode: "always",
  });
}
