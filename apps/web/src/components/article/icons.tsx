// 글 참여 모듈(하단 바·다음 글·반응) 전용 선 아이콘. components/icons.tsx 와 같은 규칙: 1.8px 선, 24px 격자, currentColor
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

// 말풍선 (댓글)
export const CommentIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5h-7.5L7 20.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z" />
  </svg>
);

// 오른쪽 화살표 (다음 글)
export const ArrowRightIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// 링크 (주소 복사)
export const LinkIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
  </svg>
);
