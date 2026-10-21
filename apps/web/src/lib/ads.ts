import { CATEGORY_GROUPS } from "@kmedia/core";

import type { PrepKey } from "@/data/travel/types";
import type { AffiliateTarget } from "@/data/types";

import { PREP_ROWS, prepTargets } from "./travel"; // 여행 준비 줄(파트너·주소)은 허브·동네·명소·글이 같은 표를 쓴다

// ───────── 구글 애드센스 ─────────

const CLIENT_ID = /^ca-pub-\d+$/;

// 애드센스 게시자 id (ca-pub-숫자). 형식이 틀리면 없는 것으로 본다 (스크립트 주소·ads.txt 에 그대로 들어간다)
export function adsenseClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  return id && CLIENT_ID.test(id) ? id : null;
}

// 광고 스크립트·소유 확인 메타는 Vercel 운영 배포에서만 (미리보기·로컬 주소는 애드센스에 등록한 사이트가 아니다)
export function adsenseClient(): string | null {
  return process.env.VERCEL_ENV === "production" ? adsenseClientId() : null;
}

// ───────── 쿠팡 파트너스 ─────────

// 파트너스에 등록한 미디어 주소. 여기 없는 주소(미리보기·배포마다 생기는 *.vercel.app·로컬)에는 배너를 내지 않는다.
// 도메인을 바꾸면 파트너스 '미디어 관리'에 먼저 등록하고 여기에 더한다. 등록하지 않은 미디어에 광고를 내면 약관 8조②9호 위반이다.
// unnienote.app(2026-10-19 도메인 이전, 옛 주소는 308 로 넘어온다)은 등록을 확인한 뒤에 더한다 — 그 전까지 배너는 나가지 않는다
const COUPANG_MEDIA_HOSTS: readonly string[] = ["hallyu-brief.vercel.app"];

// 쿠팡은 한국 안에서만 팔고 배송해서, 기기 시간대가 한국(Asia/Seoul)인 방문자에게만 배너를 보인다.
// 유럽 등 해외 방문자에게는 동의 없이 쿠팡 쿠키가 생기지 않는다. 시간대는 브라우저 안에서만 보고 서버로 보내지 않는다.
// <head> 에서 그리기 전에 html[data-coupang] 을 달아, 배너 칸이 하이드레이션 뒤에 끼어들어 아래가 밀리지 않게 한다.
// 데이터 절약 모드(Save-Data, lib/save-data.ts)면 칸째 내지 않는다 — 배너를 내지 않는 것은 정책 위반이 아니다
const COUPANG_GATE = `try{if(${JSON.stringify(COUPANG_MEDIA_HOSTS)}.indexOf(location.hostname)>-1&&Intl.DateTimeFormat().resolvedOptions().timeZone==="Asia/Seoul"&&!(navigator.connection&&navigator.connection.saveData))document.documentElement.setAttribute("data-coupang","")}catch(e){}`;

// 배너를 보일지 정하는 인라인 스크립트. Vercel 운영 배포에서만 (미리보기·로컬은 등록 미디어가 아니다)
export function coupangGateScript(): string | null {
  return process.env.VERCEL_ENV === "production" ? COUPANG_GATE : null;
}

// 파트너스에서 만든 다이나믹 배너 (캐러셀): 개인화 추천, 뷰티 카테고리 베스트, 푸드 카테고리 베스트
export const COUPANG_BANNER = { general: 1040122, beauty: 1040123, food: 1040124 } as const;
export type CoupangBannerId = (typeof COUPANG_BANNER)[keyof typeof COUPANG_BANNER];

// 파트너스가 준 iframe 주소 그대로 (배너마다 id 만 다르다). 링크·형태·갱신 주기를 바꾸면 운영정책 위반이다
export const coupangWidgetSrc = (id: CoupangBannerId) =>
  `https://ads-partners.coupang.com/widgets.html?id=${id}&template=carousel&trackingCode=AF2109367&subId=&width=100%&height=140&tsource=`;

const ENTERTAINMENT: readonly string[] = CATEGORY_GROUPS.ENTERTAINMENT;
const LIVING: readonly string[] = CATEGORY_GROUPS.LIVING;

// 글 하나에 붙일 쿠팡 배너 (없으면 null). 쿠팡은 한국 안에서만 팔고 배송한다. 글 페이지에서만 부른다 —
// 가이드 섹션(뷰티·여행·클리닉·드라마), 특히 의료(클리닉) 화면에는 쿠팡을 붙이지 않는다 (scripts/check-catalog.mjs 가 검사)
// - 한국어: 뷰티 글은 뷰티 베스트, 푸드 글은 푸드 베스트, 나머지는 개인화 추천
// - 다른 언어: 한국에 사는 외국인이 읽는 생활 카테고리(유학·연애/결혼·워홀·일자리·집·생활)만 개인화 추천.
//   케이팝 뷰티·음식·여행 글은 대부분 해외에서 읽어 사도 받을 수 없다
// 연예 글과 국내 반응 글은 실존 인물·논란 소재라 파트너스 부적합 콘텐츠 위험이 커서 어느 언어에도 붙이지 않는다
export function coupangBannerFor({
  locale,
  category,
  format,
}: {
  locale: string;
  category: string;
  format?: string;
}): CoupangBannerId | null {
  if (ENTERTAINMENT.includes(category) || format === "REACTION") return null;
  if (locale === "ko") {
    if (category === "KBEAUTY") return COUPANG_BANNER.beauty;
    if (category === "KFOOD") return COUPANG_BANNER.food;
    return COUPANG_BANNER.general;
  }
  return LIVING.includes(category) ? COUPANG_BANNER.general : null;
}

// ───────── 생활 글의 여행 준비 제휴 ─────────

// 한국에 오거나 사는 독자가 읽는 생활 글: 글 끝(교차 레일 앞)에 '여행 준비' 제휴 상자를 단다 (docs/monetize/BM-VALIDATION.md §6 P7-3)
const PREP_CATEGORIES: readonly string[] = ["TRAVEL", "WORKING_HOLIDAY", "STUDY", "HOUSING"];


// 이 분류·언어의 글에 붙일 여행 준비 줄 (없으면 빈 목록). 이름·설명은 여행 카탈로그 문구(prep.items)를 쓴다.
// 한국어판 독자는 대부분 한국에 있어 eSIM·공항 이동이 쓸모없다 (한국어 글에는 쿠팡 배너가 대신 붙는다)
export function articlePrepFor(category: string, locale: string): readonly { key: PrepKey; target: AffiliateTarget }[] {
  return locale !== "ko" && PREP_CATEGORIES.includes(category) ? prepTargets(PREP_ROWS.article, locale) : [];
}
