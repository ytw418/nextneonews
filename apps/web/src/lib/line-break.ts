// 여는 괄호·여는 따옴표(유니코드 Ps·Pi)가 줄 끝에 홀로 남지 않게, 바로 뒤 글자와 한 묶음으로 만든다.
// 사파리 27(WebKit 311090@main)부터 word-break:keep-all 이 모든 구두점 뒤를 줄바꿈 자리로 열어
// "ボトックス（ / ボツリヌス…", "淨膚雷射（ / Laser" 처럼 끊긴다 (docs/predeploy/verify-kinsoku-webkit.md).
// 묶음은 화면에서 whitespace-nowrap 으로 그린다 (components/Phrase.tsx). 의존성 없는 순수 함수라 클라이언트에서도 쓴다

const TRAILING_OPENERS = /[\p{Ps}\p{Pi}]+$/u;
// 여는 괄호 묶음(1) + 뒤 글자 하나와 결합 문자(2)
const OPENER_RUN = /([\p{Ps}\p{Pi}]+)(\P{M}\p{M}*)?/gu;

export type LinePiece = string | { nowrap: string };

// 구(chunk) 사이에만 줄바꿈 자리(<wbr>)를 두는 목록을 받아, 구마다 [글자 | 묶음] 조각으로 나눈다.
// 구 끝에 붙은 여는 괄호는 다음 구 앞으로 옮긴다 (괄호 바로 뒤에 <wbr> 이 오지 않게)
export function bindOpeners(chunks: readonly string[]): LinePiece[][] {
  const moved: string[] = [];
  let carry = "";
  chunks.forEach((chunk, i) => {
    let text = carry + chunk;
    carry = i < chunks.length - 1 ? (TRAILING_OPENERS.exec(text)?.[0] ?? "") : "";
    if (carry) text = text.slice(0, -carry.length);
    if (text) moved.push(text);
  });

  return moved.map((text) => {
    const pieces: LinePiece[] = [];
    let last = 0;
    for (const m of text.matchAll(OPENER_RUN)) {
      if (!m[2]) continue; // 글 맨 끝의 여는 괄호는 묶을 뒤 글자가 없다
      if (m.index > last) pieces.push(text.slice(last, m.index));
      pieces.push({ nowrap: m[0] });
      last = m.index + m[0].length;
    }
    if (last < text.length) pieces.push(text.slice(last));
    return pieces;
  });
}
