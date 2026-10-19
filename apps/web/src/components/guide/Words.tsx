import { PhraseChunks, splitPhrase } from "@/components/Phrase";

// 좁은 타일·카드의 짧은 문구가 단어 중간에서 끊기지 않게: 한국어는 어절(keep-all), 일본어·중국어는 구(Phrase) 단위로만 줄을 바꾼다.
// 그 밖의 언어는 keep-all 을 걸지 않는다: 사파리 27 은 keep-all 이면 키릴 문자 글에서도 '(' 뒤를 끊는다(ru 'птоза ( / операция').
// 한 단어가 칸보다 길 때만 아무 데서나 끊는다.
// chunks: 클라이언트 컴포넌트가 그릴 때 서버가 splitPhrase 로 나눠 보낸 구. 없으면(브라우저 번들) 글을 그대로 둔다
export function Words({ text, locale, chunks }: { text: string; locale: string; chunks?: readonly string[] | null }) {
  const parts = locale === "ko" ? [text] : (chunks ?? splitPhrase(text, locale));
  if (parts) return <PhraseChunks chunks={parts} />;
  return <span className="[overflow-wrap:anywhere]">{text}</span>;
}
