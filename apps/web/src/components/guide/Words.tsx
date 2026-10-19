import { Phrase } from "@/components/Phrase";

// 좁은 타일·카드의 짧은 문구가 단어 중간에서 끊기지 않게: 한국어는 어절(keep-all), 일본어·중국어는 구(Phrase) 단위로만 줄을 바꾼다.
// 한 단어가 칸보다 길 때만 아무 데서나 끊는다
export function Words({ text, locale }: { text: string; locale: string }) {
  return (
    <span className="[word-break:keep-all] [overflow-wrap:anywhere]">
      <Phrase text={text} locale={locale} />
    </span>
  );
}
