// 사진 없는 기사의 메모 커버를 글마다 일정하게(같은 글은 항상 같은 모양) 만든다
const TINT: Record<string, string> = {
  KPOP: "var(--tint-kpop)",
  KENT: "var(--tint-kent)",
  KDRAMA: "var(--tint-kdrama)",
  KFOOD: "var(--tint-kfood)",
  KBEAUTY: "var(--tint-kbeauty)",
  TRAVEL: "var(--tint-travel)",
  STUDY: "var(--tint-study)",
  LOVE: "var(--tint-love)",
  WORKING_HOLIDAY: "var(--tint-wh)",
  JOBS: "var(--tint-jobs)",
  HOUSING: "var(--tint-housing)",
  LIFE: "var(--tint-life)",
};

// 카테고리 색 (메모 커버·메뉴 칩). 틴트는 카테고리만 뜻한다
export function categoryTint(category: string): string {
  return TINT[category] ?? TINT.LIFE!;
}

// Tailwind 가 클래스를 찾을 수 있게 문자열을 그대로 둔다
const RATIOS = ["aspect-[4/5]", "aspect-square", "aspect-[4/5]", "aspect-[5/6]"] as const;
type Ratio = (typeof RATIOS)[number];

// 세로/가로 비율 (피드를 두 열로 나눌 때 카드 높이를 어림한다)
const ASPECT: Record<Ratio, number> = {
  "aspect-[4/5]": 1.25,
  "aspect-square": 1,
  "aspect-[5/6]": 1.2,
};

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface CoverStyle {
  tint: string;
  ratio: Ratio;
  aspect: number; // 높이/폭
  tapeTilt: number;
}

export function coverStyle(seed: string, category: string): CoverStyle {
  const h = hash(seed);
  const ratio = RATIOS[h % RATIOS.length]!;
  return {
    tint: categoryTint(category),
    ratio,
    aspect: ASPECT[ratio],
    tapeTilt: ((h >> 10) % 7) - 3,
  };
}
