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
    // 두세 글자 영문 이름은 대문자일 때만 (IU·BoA 는 되고 "Min" 이 "Kim Min-jong" 에 걸리지 않게).
    // 로마자 한국 이름은 하이픈으로 이어지므로 하이픈·아포스트로피 앞뒤는 경계로 보지 않는다
    if (name.length <= 3 && name !== name.toUpperCase() && name !== "BoA") return false;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^A-Za-z0-9'-])${escaped}([^A-Za-z0-9'-]|$)`).test(text);
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

// ── 대표 사진 주인공 고르기 (images.ts) ──

// 이름 바로 뒤에 오면 그 사람이 아니라 주변 사람 이야기다 ("정경호父", "보아 닮은꼴", "아이유 절친")
const RELATION = /^\s?(父|母|부친|모친|아버지|어머니|아들|딸|아내|남편|동생|언니|오빠|누나|형|조카|절친|친구|닮은꼴|매니저|측|소속사|팬)/;

// 곁가지로 나온 사람: "아이유도 반했다"(…도), "진에게 받은"(…에게). 가운뎃점으로 묶인 이름은
// 묶음 끝 조사를 따른다 ("정해인·지디도 좋아요 눌렀다…장원영" 의 정해인은 주인공이 아니다)
const SIDE_PARTICLE = /^(도|에게|한테|께)(?![가-힣])/;
const LIST_ITEM = /^[·∙・][^\s·∙・,…'"‘’“”]*?(?=도(?![가-힣])|에게|한테|께(?![가-힣])|[·∙・\s,…'"‘’“”]|$)/;

function sideMention(rest: string): boolean {
  let tail = rest;
  for (let item = LIST_ITEM.exec(tail); item?.[0]; item = LIST_ITEM.exec(tail)) tail = tail.slice(item[0].length);
  return SIDE_PARTICLE.test(tail);
}

// 한국어 제목에서 이 이름들이 주인공으로 처음 나오는 자리 (없으면 -1)
export function subjectIndex(head: string, names: string[]): number {
  let best = -1;
  for (const name of names) {
    for (let at = head.indexOf(name); at !== -1; at = head.indexOf(name, at + 1)) {
      const rest = head.slice(at + name.length);
      if (RELATION.test(rest) || sideMention(rest)) continue;
      if (best === -1 || at < best) best = at;
      break;
    }
  }
  return best;
}

// 영어 제목에서 이 앞에 오면 주인공이 아니다: "… Draws Likes From Jung Hae-in and G-Dragon"
const EN_NOT_SUBJECT = /\b(from|with|and|likes?|by|to|for|of|feat|featuring|vs|versus)\b|[&×]/i;

// 영어 번역 제목으로 한 번 더 확인: 이름(로마자)이 제목에 있고, 그 앞에 from·with·and·likes 같은 말이 없어야 한다.
// "IVE's Jang Won-young" 처럼 소유격('s)은 이름 끝으로 본다
export function englishSubject(title: string, names: (string | null)[]): boolean {
  let first = Infinity;
  for (const name of names) {
    if (!name || !LATIN.test(name)) continue;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`(^|[^A-Za-z0-9'’-])${escaped}(?=['’]s\\b|[^A-Za-z0-9'’-]|$)`).exec(title);
    if (match) first = Math.min(first, match.index + match[1]!.length);
  }
  return Number.isFinite(first) && !EN_NOT_SUBJECT.test(title.slice(0, first));
}
