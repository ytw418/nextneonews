// 선 아이콘 (이모지 대신). 1.8px 선, 24px 격자
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

export const HomeIcon = () => (
  <svg {...base}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
  </svg>
);

export const TicketIcon = () => (
  <svg {...base}>
    <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z" />
    <path d="M14 6.5v11" strokeDasharray="1.6 2.4" />
  </svg>
);

export const GlobeIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="8" />
    <path d="M4 12h16M12 4c2.2 2.3 3.2 5 3.2 8s-1 5.7-3.2 8c-2.2-2.3-3.2-5-3.2-8s1-5.7 3.2-8z" />
  </svg>
);

export const ShareIcon = () => (
  <svg {...base}>
    <path d="M12 15V4M8 7.5 12 4l4 3.5" />
    <path d="M7 11H6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1" />
  </svg>
);

export const BackIcon = () => (
  <svg {...base}>
    <path d="M15 5 8 12l7 7" />
  </svg>
);
