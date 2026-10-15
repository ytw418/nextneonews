import { loadDefaultJapaneseParser, loadDefaultTraditionalChineseParser } from "budoux";
import { Fragment } from "react";

// 일본어·중국어 제목이 "主/演"처럼 단어 중간에서 끊기지 않게, 의미 단위(구)마다만 줄바꿈을 허용한다.
// BudouX(구글 오픈소스)는 규칙 기반이라 AI 호출 없이 서버에서 바로 돈다.
const parsers = {
  ja: loadDefaultJapaneseParser(),
  "zh-TW": loadDefaultTraditionalChineseParser(),
} as const;

export function Phrase({ text, locale }: { text: string; locale: string }) {
  const parser = parsers[locale as keyof typeof parsers];
  if (!parser) return <>{text}</>;
  const chunks = parser.parse(text);
  return (
    <span className="[word-break:keep-all] [overflow-wrap:anywhere]">
      {chunks.map((chunk, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {chunk}
        </Fragment>
      ))}
    </span>
  );
}
