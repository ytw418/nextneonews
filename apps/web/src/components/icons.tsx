// 선 아이콘 (이모지 대신). 1.8px 선, 24px 격자, 단색(currentColor). 크기·색은 className 으로 바꾼다
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

const HOME = "M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z";
const TICKET =
  "M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z";

export const HomeIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={HOME} />
  </svg>
);

// 선택된 탭용 (같은 모양을 채운다)
export const HomeFilledIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={HOME} fill="currentColor" />
  </svg>
);

export const TicketIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={TICKET} />
    <path d="M14 6.5v11" strokeDasharray="1.6 2.4" />
  </svg>
);

// 채운 티켓. 절취선은 탭바 캡슐 색으로 그어 구멍처럼 보이게 한다
export const TicketFilledIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={TICKET} fill="currentColor" />
    <path d="M14 7.5v9" stroke="var(--floating)" strokeDasharray="1.6 2.4" />
  </svg>
);

export const GlobeIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="8" />
    <path d="M4 12h16M12 4c2.2 2.3 3.2 5 3.2 8s-1 5.7-3.2 8c-2.2-2.3-3.2-5-3.2-8s1-5.7 3.2-8z" />
  </svg>
);

export const ShareIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 15V4M8 7.5 12 4l4 3.5" />
    <path d="M7 11H6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1" />
  </svg>
);

export const BackIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M15 5 8 12l7 7" />
  </svg>
);

// 다른 화면으로 넘어가는 줄 끝
export const ChevronRightIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export const ChevronDownIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 9l7 7 7-7" />
  </svg>
);

export const CheckIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 12.5 10 17.5 19 7" />
  </svg>
);

export const CloseIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

// 더보기(···) — 댓글 메뉴 등
export const MoreIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="6" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

// 메뉴(햄버거) — 상단바 오른쪽 끝
export const MenuIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const ShuffleIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 17h2.5c2 0 3.3-.9 4.4-2.6l2.2-3.8C14.2 8.9 15.5 8 17.5 8H20" />
    <path d="M4 7h2.5c1.6 0 2.7.6 3.6 1.7M13.9 15.3c.9 1.1 2 1.7 3.6 1.7H20" />
    <path d="M17.5 5.5 20 8l-2.5 2.5M17.5 14.5 20 17l-2.5 2.5" />
  </svg>
);

// 사이트 밖으로 나가는 링크
export const ExternalIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </svg>
);

export const PlayIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M8 5.5v13l10.5-6.5z" />
  </svg>
);
