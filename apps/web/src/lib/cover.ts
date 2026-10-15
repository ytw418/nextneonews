// 사진 없는 기사의 메모 커버를 글마다 일정하게(같은 글은 항상 같은 모양) 만든다
const TINT: Record<string, string> = {
  KPOP: "var(--tint-kpop)",
  KENT: "var(--tint-life)",
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

// Tailwind 가 클래스를 찾을 수 있게 문자열을 그대로 둔다
const RATIOS = ["aspect-[4/5]", "aspect-square", "aspect-[4/5]", "aspect-[5/6]"] as const;

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
  ratio: (typeof RATIOS)[number];
  tapeTilt: number;
}

export function coverStyle(seed: string, category: string): CoverStyle {
  const h = hash(seed);
  return {
    tint: TINT[category] ?? TINT.LIFE!,
    ratio: RATIOS[h % RATIOS.length]!,
    tapeTilt: ((h >> 10) % 7) - 3,
  };
}
