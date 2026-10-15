import { SITE_NAME } from "@kmedia/core";

import { Link } from "@/i18n/navigation";

// iOS 처럼 반투명 블러 상단바. 노치(safe-area) 아래부터 시작한다
export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-[var(--bar)] pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-12 max-w-[640px] items-center justify-between px-4">
        <Link href="/" className="font-display text-[23px] italic leading-none tracking-[-0.01em]">
          {SITE_NAME.split(" ")[0]}
          <span className="text-cherry">.</span>
          <span className="ml-1 not-italic font-label text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            {SITE_NAME.split(" ").slice(1).join(" ")}
          </span>
        </Link>
        {children}
      </div>
    </header>
  );
}
