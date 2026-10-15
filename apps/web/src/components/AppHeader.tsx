import { SITE_NAME } from "@kmedia/core";

import { Link } from "@/i18n/navigation";

// iOS 처럼 반투명 블러 상단바. 노치(safe-area) 아래부터 시작한다.
// 줄 안쪽 여백 10px + 44px 버튼이라 아이콘 글리프가 화면 끝에서 정확히 20px(gutter)에 온다.
// 아래 선은 스크롤했을 때만 (globals.css html[data-scrolled] .app-header)
export function AppHeader({ children }: { children?: React.ReactNode }) {
  const [word, ...rest] = SITE_NAME.split(" ");
  return (
    <header className="app-header sticky top-0 z-30 bg-bar pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="relative mx-auto flex min-h-12 max-w-[640px] items-center px-2.5">
        <Link href="/" aria-label={SITE_NAME} className="ml-2.5 flex items-baseline">
          <span aria-hidden className="wordmark">
            {word}
            <span className="wordmark-dot">.</span>
          </span>
          <span aria-hidden className="wordmark-sub">
            {rest.join(" ")}
          </span>
        </Link>
        <div className="ml-auto flex items-center">{children}</div>
      </div>
    </header>
  );
}
