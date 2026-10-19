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
const HEART = "M12 20.5 4.6 13.1a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9a4.6 4.6 0 0 1 6.5 6.5z";
const STAR = "m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z";

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

// 아이폰 공유 시트의 '홈 화면에 추가' 모양 (설치 안내)
export const PlusSquareIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="M12 8.5v7M8.5 12h7" />
  </svg>
);

// ── 카테고리 글리프: 사진 없는 작은 썸네일 가운데 (ArticleThumb). 빈 네모가 사진이 안 뜬 것처럼 보였다 ──
export const MicIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
  </svg>
);

export const ClapperIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 10h16v8.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5z" />
    <path d="m4 10-.5-2.2a1.5 1.5 0 0 1 1.1-1.8l12.4-3a1.5 1.5 0 0 1 1.8 1.1l.5 2z" />
    <path d="m8.6 5 2.2 3.8M13.6 3.8l2.2 3.8" />
  </svg>
);

export const StarIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={STAR} />
  </svg>
);

// 별점에서 고른 별
export const StarFilledIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={STAR} fill="currentColor" />
  </svg>
);

export const PlaneIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 3c.8 0 1.3.8 1.3 1.8V10l7.2 4.2V16l-7.2-2.2v4.4l2.2 1.6V21L12 20.2 8.5 21v-1.2l2.2-1.6v-4.4L3.5 16v-1.8l7.2-4.2V4.8C10.7 3.8 11.2 3 12 3z" />
  </svg>
);

export const HeartIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={HEART} />
  </svg>
);

// 채운 하트 (rankings/icons.tsx 응원 하트와 같은 모양). 하트는 글 반응·응원 전용, 저장은 북마크
export const HeartFilledIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={HEART} fill="currentColor" />
  </svg>
);

// 저장(북마크). 글 반응 하트와 헷갈리지 않게 저장 버튼·저장 탭·저장함은 이 모양만 쓴다
const BOOKMARK = "M7 3.8h10a1.2 1.2 0 0 1 1.2 1.2v15.2L12 16.1l-6.2 4.1V5A1.2 1.2 0 0 1 7 3.8z";

export const BookmarkIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={BOOKMARK} />
  </svg>
);

export const BookmarkFilledIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d={BOOKMARK} fill="currentColor" />
  </svg>
);

export const BowlIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3.5 11h17a8.5 8.5 0 0 1-17 0zM8 20.5h8" />
    <path d="M9.5 7.5c0-1 1-1.5 1-2.5M13.5 7.5c0-1 1-1.5 1-2.5" />
  </svg>
);

export const SparkleIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m12 3.5 1.8 6.7 6.7 1.8-6.7 1.8-1.8 6.7-1.8-6.7L3.5 12l6.7-1.8z" />
  </svg>
);

export const BookIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 6.5C10.5 5 8 4.5 4 4.5v14c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-14c-4 0-6.5.5-8 2zM12 6.5v14" />
  </svg>
);

export const BriefcaseIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
    <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17" />
  </svg>
);

export const SunIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
  </svg>
);
