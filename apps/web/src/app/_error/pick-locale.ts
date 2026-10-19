import { LOCALE_PATH_PREFIX, LOCALES } from "@kmedia/core";

// 레이아웃 밖 정적 화면(루트 not-found·global-error)은 요청 언어를 모른 채 빌드 때 한 번 그려진다.
// 그래서 9개 언어를 한 벌씩 그려 두고, 그리기 전에 주소 첫 마디(/zh-tw/…)의 언어 한 벌만 보이게 한다.
// 스크립트가 돌지 않으면 영어가 보인다. 함수·DB 호출 없이 CDN 의 정적 HTML 로 나간다

const PAGE_ATTR = "data-error-locale";
export const BLOCK_ATTR = "data-error-block";

// 주소 첫 마디(zh-tw) → 언어 코드(zh-TW)
const PREFIX_TO_LOCALE = Object.fromEntries(LOCALES.map((l) => [LOCALE_PATH_PREFIX[l].slice(1), l]));

// <html> 에 언어(lang·표시 속성)를 달고, 넘겨받은 클래스(로고 글꼴 변수)를 더한다
export function pickLocaleScript(htmlClass = ""): string {
  return `(function(m,c){try{var h=document.documentElement;if(c)h.classList.add(c);var l=m[location.pathname.split("/")[1].toLowerCase()];if(l){h.lang=l;h.setAttribute(${JSON.stringify(PAGE_ATTR)},l)}}catch(e){}})(${JSON.stringify(PREFIX_TO_LOCALE)},${JSON.stringify(htmlClass)})`.replace(
    /</g,
    "\\u003c",
  );
}

// 고른 언어 한 벌(아무것도 고르지 않았으면 영어)만 보인다
const SHOWN = [
  `html:not([${PAGE_ATTR}]) [${BLOCK_ATTR}="en"]`,
  ...LOCALES.map((l) => `html[${PAGE_ATTR}="${l}"] [${BLOCK_ATTR}="${l}"]`),
].join(",");
export const PICK_LOCALE_STYLE = `[${BLOCK_ATTR}]{display:none}${SHOWN}{display:block}`;
