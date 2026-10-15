// 제목 속 이름 매칭 규칙 (AI 없이). 오인식이 잦은 경우를 규칙으로 막는다.

const LATIN = /^[A-Za-z0-9 .&'-]+$/;
const HANGUL = /[가-힣]/;

// 이름 바로 뒤에 올 수 있는 것: 조사·호칭·기호·끝. 그 밖의 한글이 오면 더 긴 다른 단어의 일부다 ("이영돈"의 "이영")
const PARTICLES = ["이", "가", "은", "는", "을", "를", "의", "와", "과", "도", "만", "에", "랑", "측", "씨", "로", "께"];

// 인물·그룹 이름이지만 일상 단어와 겹치는 것
// 사람 이름이기도 한 일반 단어. 기사에서 "요구안 제시", "드라마 주연", "아리랑TV" 처럼 흔히 쓰인다
export const COMMON_WORDS = new Set([
  "아이", "수영", "하나", "소유", "보라", "나비", "선물", "사랑", "가족", "친구", "엄마", "아빠", "하늘", "바다", "여름", "겨울",
  "제시", "주연", "아리랑", "소란", "태풍", "오늘", "하루", "미래", "진심", "바람", "노을", "시월", "영원",
]);

// 드라마 제목은 따옴표 안에 있을 때만 인정 ("개과천선" 같은 일반 단어와 구분)
const QUOTE_OPEN = "‘'\"“《「<『〈";
const QUOTE_CLOSE = "’'\"”》」>』〉";

function boundaryOk(text: string, at: number, length: number): boolean {
  const before = at === 0 ? "" : text[at - 1]!;
  if (before && HANGUL.test(before)) return false;
  const after = text[at + length] ?? "";
  if (!after || !HANGUL.test(after)) return true;
  return PARTICLES.includes(after);
}

export function nameMatches(text: string, name: string | null, type: string): boolean {
  if (!name || name.length < 2) return false;
  if (LATIN.test(name)) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`).test(text);
  }
  if (COMMON_WORDS.has(name)) return false;

  for (let at = text.indexOf(name); at !== -1; at = text.indexOf(name, at + 1)) {
    if (type === "series") {
      const open = text[at - 1] ?? "";
      const close = text[at + name.length] ?? "";
      if (QUOTE_OPEN.includes(open) && open !== "" && QUOTE_CLOSE.includes(close) && close !== "") return true;
      continue;
    }
    if (boundaryOk(text, at, name.length)) return true;
  }
  return false;
}
