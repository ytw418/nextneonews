// 원문에서 사실이 많은 문장만 골라 AI 입력을 줄인다 (AI 호출 없이, 입력 토큰 절감)
const MAX_CHARS = 1500;

export function pickSentences(text: string, names: string[], maxChars = MAX_CHARS): string {
  if (text.length <= maxChars) return text;
  const sentences = text
    .split(/(?<=[.!?。])\s+|(?<=다\.)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const scored = sentences.map((sentence, index) => {
    let score = 0;
    if (index < 3) score += 3; // 기사 첫 문장들에 핵심이 있다
    if (names.some((n) => n && sentence.includes(n))) score += 2;
    if (/\d/.test(sentence)) score += 1; // 날짜·숫자가 있는 문장
    return { sentence, index, score };
  });

  const chosen: typeof scored = [];
  let length = 0;
  for (const item of [...scored].sort((a, b) => b.score - a.score || a.index - b.index)) {
    if (length + item.sentence.length > maxChars) continue;
    chosen.push(item);
    length += item.sentence.length + 1;
  }
  return chosen
    .sort((a, b) => a.index - b.index)
    .map((c) => c.sentence)
    .join(" ");
}
