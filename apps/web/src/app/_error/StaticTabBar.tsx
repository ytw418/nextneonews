import { CompassIcon } from "@/components/guide/icons";
import { BookmarkIcon, HomeIcon } from "@/components/icons";
import { TrophyIcon } from "@/components/rankings/icons";

export interface TabLabels {
  nav: string;
  home: string;
  rankings: string;
  guide: string;
  saved: string;
}

// 레이아웃 밖 정적 404 의 하단 탭: components/TabBar.tsx 와 같은 모양·같은 목적지를 <a> 로만 그린다
// (TabBar 는 next-intl·저장 수를 읽는 클라이언트 컴포넌트라 언어 문맥이 없는 화면에서 쓸 수 없다). 선택된 탭은 없다
export function StaticTabBar({ prefix, labels }: { prefix: string; labels: TabLabels }) {
  const tabs = [
    { href: prefix, label: labels.home, Icon: HomeIcon },
    { href: `${prefix}/rankings`, label: labels.rankings, Icon: TrophyIcon },
    { href: `${prefix}/guide`, label: labels.guide, Icon: CompassIcon },
    { href: `${prefix}/saved`, label: labels.saved, Icon: BookmarkIcon },
  ];
  return (
    <nav
      aria-label={labels.nav}
      className="fixed bottom-[var(--tabbar-bottom)] left-1/2 z-40 flex min-h-14 -translate-x-1/2 items-center gap-1 rounded-full bg-floating/97 p-1 shadow-float ring-1 ring-line backdrop-blur-xl backdrop-saturate-150"
    >
      {tabs.map(({ href, label, Icon }) => (
        <a
          key={href}
          href={href}
          className="press flex min-h-12 min-w-17 flex-col items-center justify-center gap-0.5 rounded-full px-2 font-semibold text-ink-600"
        >
          <Icon />
          <span className="whitespace-nowrap text-chrome-tab">{label}</span>
        </a>
      ))}
    </nav>
  );
}
