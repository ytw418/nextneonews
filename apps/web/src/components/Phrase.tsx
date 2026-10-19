import {
  loadDefaultJapaneseParser,
  loadDefaultSimplifiedChineseParser,
  loadDefaultTraditionalChineseParser,
} from "budoux";
import { Fragment } from "react";

import { bindOpeners } from "@/lib/line-break";

// 일본어·중국어 제목이 "主/演"처럼 단어 중간에서 끊기지 않게, 의미 단위(구)마다만 줄바꿈을 허용한다.
// BudouX(구글 오픈소스)는 규칙 기반이라 AI 호출 없이 서버에서 바로 돈다.
// 브라우저 번들에는 싣지 않는다(사전·linkedom 약 140KB): next.config.ts 가 브라우저 빌드에서 budoux 를
// lib/budoux-browser.ts(분석기 없음)로 바꾼다. 그래서 클라이언트에서 그리면 글을 그대로 둔다 —
// 클라이언트에서도 구 단위로 그리려면 서버가 splitPhrase 로 나눈 조각을 chunks 로 넘긴다
type Parser = ReturnType<typeof loadDefaultJapaneseParser>;

const LOADERS: Record<string, () => Parser | null> = {
  ja: loadDefaultJapaneseParser,
  "zh-TW": loadDefaultTraditionalChineseParser,
  "zh-CN": loadDefaultSimplifiedChineseParser,
};

// 사전은 그 언어를 처음 그릴 때 한 번만 읽는다 (영어 화면만 그리는 서버는 읽지 않는다)
const parsers = new Map<string, Parser | null>();

function parserFor(locale: string): Parser | null {
  if (!parsers.has(locale)) parsers.set(locale, LOADERS[locale]?.() ?? null);
  return parsers.get(locale) ?? null;
}

// 구 단위로 나눈 조각. 나누지 않는 언어이거나 브라우저 번들이면 null (서버 API 가 응답에 실어 보낼 때 쓴다)
export function splitPhrase(text: string, locale: string): string[] | null {
  return parserFor(locale)?.parse(text) ?? null;
}

// 구 사이에만 <wbr>, 여는 괄호는 뒤 글자와 묶는다 (사파리 27 keep-all 이 괄호 뒤에서 끊는다, lib/line-break.ts)
export function PhraseChunks({ chunks }: { chunks: readonly string[] }) {
  return (
    <span className="[word-break:keep-all] [overflow-wrap:anywhere]">
      {bindOpeners(chunks).map((pieces, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {pieces.map((piece, j) =>
            typeof piece === "string" ? (
              <Fragment key={j}>{piece}</Fragment>
            ) : (
              <span key={j} className="whitespace-nowrap">
                {piece.nowrap}
              </span>
            ),
          )}
        </Fragment>
      ))}
    </span>
  );
}

export function Phrase({ text, locale, chunks }: { text: string; locale: string; chunks?: readonly string[] | null }) {
  const parts = chunks ?? splitPhrase(text, locale);
  if (!parts) return <>{text}</>;
  return <PhraseChunks chunks={parts} />;
}
