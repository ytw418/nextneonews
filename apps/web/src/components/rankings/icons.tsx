// 랭킹 전용 선 아이콘 (components/icons.tsx 와 같은 규칙: 1.8px 선, 24px 격자, currentColor)
const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

interface IconProps {
  className?: string;
}

const CUP = "M7 4.5h10V9a5 5 0 0 1-10 0z";
const HANDLES = "M7 6.5H4.5v1A3 3 0 0 0 7.3 10.5M17 6.5h2.5v1a3 3 0 0 1-2.8 3M12 14v3.5M8.5 20.5h7l-.6-3H9.1z";
const HEART = "M12 20.5 4.6 13.1a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9a4.6 4.6 0 0 1 6.5 6.5z";

// 하단 탭 '랭킹'
export const TrophyIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={CUP} />
    <path d={HANDLES} />
  </svg>
);

// 선택된 탭용 (컵만 채운다)
export const TrophyFilledIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={CUP} fill="currentColor" />
    <path d={HANDLES} />
  </svg>
);

// 응원하기 (누르기 전)
export const CheerIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={HEART} />
  </svg>
);

// 오늘 응원함
export const CheerFilledIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={HEART} fill="currentColor" />
  </svg>
);
