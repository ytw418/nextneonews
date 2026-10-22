import { RobotsDisallowedError } from "./robots";

// 약관·robots 가 자동 수집을 막는 사이트. robots.txt 가 허용해도 요청하지 않는다 (docs/PRD.md 5장).
// 주제는 사람이 씨앗으로만 넣는다 (manualSeed.ts, `seed-topic`).
// - dcinside.com: 약관(2026-10-07 시행) 16조① 사전 서면 동의 없는 크롤링 금지, 11조 13호 자동 수집·14호 IP 변경·VPN 접속 금지
// - instiz.net: robots.txt 까지 Cloudflare 확인 화면(cf-mitigated: challenge). 확인 화면을 푸는 것은 보호조치 우회라 하지 않는다
// - pann.nate.com·n.news.naver.com·music.bugs.co.kr·genie.co.kr: robots.txt "User-agent: * Disallow: /" (2026-10-16 확인)
// - news.naver.com·entertain.naver.com: 네이버 뉴스·연예 (entertain 은 robots.txt 자리에 앱 화면을 돌려줘 규칙을 읽을 수 없다)
// - oliveyoung.co.kr: robots.txt 를 수집기에 403 으로 막는다 (제휴 신청 뒤 피드로)
// - global.oliveyoung.com: 제휴 파트너 쇼핑몰. 제품 정보는 제휴 피드·공식 브랜드 페이지로만 받고 상품 페이지를 긁지 않는다 (2026-10-19)
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
  "global.oliveyoung.com",
] as const;

// 우리 독자(한국 문화를 좋아하는 해외 독자)와 상관없는 주제. 제목에 하나라도 있으면 인물 사전에 걸린 이름이 있어도 '무관'으로 거른다
// (pipeline/heuristics.ts). 2026-10-19 해외 축구·스테이블코인·사우디 처형 기사가 K-POP 딱지를 달고 발행돼
// 독자가 '콘텐츠 농장'으로 읽었다 (docs/monetize/BM-VALIDATION.md §2). 라틴 글자는 대소문자를 가리지 않는다.
// 도시 이름과 겹치는 구단(바르셀로나·리버풀)은 구단을 가리키는 꼴로만 적는다 — 콘서트·여행 기사가 걸리지 않게
export const OFF_TOPIC_TERMS = {
  // 해외 축구: 구단·리그·감독 (한국 선수 이적설도 연예·생활 기사가 아니다)
  football: [
    "레알 마드리드", "레알마드리드", "FC바르셀로나", "FC 바르셀로나", "바르사", "세비야", "아틀레티코", "맨유", "맨체스터 유나이티드",
    "맨시티", "맨체스터 시티", "리버풀FC", "리버풀 FC", "아스널", "아스날", "첼시", "토트넘", "바이에른", "파리 생제르맹",
    "유벤투스", "인터 밀란", "AC밀란", "AC 밀란", "노팅엄", "뉴캐슬", "도르트문트", "레버쿠젠",
    "프리미어리그", "라리가", "분데스리가", "세리에A", "챔피언스리그", "유로파리그",
    "무리뉴", "과르디올라", "안첼로티", "클롭", "아르테타", "사비 알론소", "시메오네", "포스테코글루", "텐 하흐", "투헬", "아모림",
    "Real Madrid", "FC Barcelona", "Sevilla", "Atletico Madrid", "Manchester United", "Man United", "Manchester City",
    "Man City", "Liverpool FC", "Arsenal", "Chelsea FC", "Tottenham", "Bayern", "Paris Saint-Germain", "PSG", "Juventus",
    "Inter Milan", "AC Milan", "Nottingham Forest", "Newcastle United", "Dortmund", "Leverkusen", "Persib",
    "Premier League", "La Liga", "Bundesliga", "Serie A", "Champions League", "Europa League",
    "Mourinho", "Guardiola", "Ancelotti", "Klopp", "Arteta", "Xabi Alonso", "Simeone", "Postecoglou", "Ten Hag", "Tuchel", "Amorim",
  ],
  // 코인·스테이블코인
  crypto: [
    "스테이블코인", "비트코인", "이더리움", "가상자산", "가상화폐", "암호화폐",
    "stablecoin", "bitcoin", "ethereum", "crypto",
  ],
  // 2026-10-22 사용자 결정: 독자(10~30대 여성)가 관심 없는 무거운 주제 — 전쟁·정치·경제·죽음·강력 범죄
  war: ["전쟁", "공습", "미사일", "휴전", "교전", "우크라이나", "가자지구", "하마스", "헤즈볼라", "북한군"],
  politics: ["대통령", "국정감사", "국감", "국회의원", "여당", "야당", "총선", "대선", "탄핵", "민주당", "국민의힘"],
  economy: ["주가", "코스피", "코스닥", "환율", "금리", "증시", "관세", "영업이익", "매출액", "반도체", "부동산 대책"],
  grim: ["별세", "사망", "부고", "숨진", "숨져", "살인", "마약", "대마", "필로폰", "성폭행", "음주운전", "징역", "구속"],
  // 해외 처형·테러. '처형'은 가족 호칭(妻兄)과 같은 글자라 집행을 뜻하는 꼴만, 영어는 executive 가 걸리지 않게 execution·executes 꼴만
  violence: [
    "사형 집행", "사형집행", "명 처형", "처형했", "처형된", "처형됐", "참수", "테러",
    "execution", "executes", "executed", "beheading", "terror attack", "terrorist",
  ],
} as const;

const OFF_TOPIC = Object.values(OFF_TOPIC_TERMS)
  .flat()
  .map((term) => ({ term, needle: term.toLowerCase() }));

// 제목에 걸린 무관 주제 단어 (없으면 null)
export function offTopicTerm(title: string): string | null {
  const text = title.toLowerCase();
  return OFF_TOPIC.find(({ needle }) => text.includes(needle))?.term ?? null;
}

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
