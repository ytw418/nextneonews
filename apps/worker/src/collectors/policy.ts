import { RobotsDisallowedError } from "./robots";

// 약관·robots 가 자동 수집을 막는 사이트. robots.txt 가 허용해도 요청하지 않는다 (docs/PRD.md 5장).
// 주제는 사람이 씨앗으로만 넣는다 (manualSeed.ts, `seed-topic`).
// - dcinside.com: 약관(2026-10-07 시행) 16조① 사전 서면 동의 없는 크롤링 금지, 11조 13호 자동 수집·14호 IP 변경·VPN 접속 금지
// - instiz.net: robots.txt 까지 Cloudflare 확인 화면(cf-mitigated: challenge). 확인 화면을 푸는 것은 보호조치 우회라 하지 않는다
// - pann.nate.com·n.news.naver.com·music.bugs.co.kr·genie.co.kr: robots.txt "User-agent: * Disallow: /" (2026-10-16 확인)
// - news.naver.com·entertain.naver.com: 네이버 뉴스·연예 (entertain 은 robots.txt 자리에 앱 화면을 돌려줘 규칙을 읽을 수 없다)
// - oliveyoung.co.kr: robots.txt 를 수집기에 403 으로 막는다 (제휴 신청 뒤 피드로)
export const TOS_BLOCKED_HOSTS = [
  "dcinside.com",
  "instiz.net",
  "pann.nate.com",
  "news.naver.com",
  "n.news.naver.com",
  "entertain.naver.com",
  "music.bugs.co.kr",
  "genie.co.kr",
  "oliveyoung.co.kr",
] as const;

// robots 금지와 같은 뜻으로 다룬다 (원문을 못 읽음 → 다시 시도해도 같다)
export class PolicyBlockedError extends RobotsDisallowedError {}

// 호스트 접미사로 비교한다 (gall.dcinside.com → dcinside.com)
export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return TOS_BLOCKED_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

export function assertAllowedHost(url: string): void {
  if (isBlockedHost(new URL(url).hostname)) {
    throw new PolicyBlockedError(`terms of service block automated access: ${url}`);
  }
}
