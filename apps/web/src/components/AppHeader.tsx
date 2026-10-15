import { SITE_NAME } from "@kmedia/core";
import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { BackButton } from "@/components/BackButton";
import { HeaderTitle } from "@/components/HeaderTitle";
import { LanguageButton } from "@/components/LanguageButton";
import { MenuButton } from "@/components/MenuButton";
import { Link } from "@/i18n/navigation";
import { listActiveCategories } from "@/lib/articles";

interface Props {
  // root: 홈·카테고리·일정 목록 (뒤로 없음) / pushed: 글·일정 상세 (뒤로 있음)
  variant?: "root" | "pushed";
  showLogo?: boolean; // root 에서만. 일정 목록처럼 로고 대신 제목을 띄울 때 false
  title?: string; // 페이지의 h1 이 바 밑으로 올라가면 가운데에 나타난다
  parentHref?: string; // 뒤에 우리 기록이 없을 때 '뒤로'가 갈 곳
  action?: ReactNode; // 언어 버튼 왼쪽 (공유 등)
}

// iOS 처럼 반투명 블러 상단바. 노치(safe-area) 아래부터 시작한다.
// 줄 안쪽 여백 10px + 44px 버튼이라 뒤로 글리프와 메뉴 글리프가 화면 끝에서 정확히 20px(gutter)에 온다.
// 오른쪽은 언제나 [action][언어][메뉴] — 지구본은 어느 페이지에서나 같은 자리에 있다.
// 아래 선은 스크롤했을 때만 (globals.css html[data-scrolled] .app-header)
export async function AppHeader({ variant = "root", showLogo = true, title, parentHref = "/", action }: Props) {
  const locale = await getLocale();
  const categories = await listActiveCategories(locale);
  const [word, ...rest] = SITE_NAME.split(" ");

  return (
    <header className="app-header sticky top-0 z-30 bg-bar pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="relative mx-auto flex min-h-12 max-w-[640px] items-center px-2.5">
        {variant === "pushed" && <BackButton parentHref={parentHref} />}
        {variant === "root" && showLogo && (
          <Link href="/" aria-label={SITE_NAME} className="ml-2.5 flex items-baseline">
            <span aria-hidden className="wordmark">
              {word}
              <span className="wordmark-dot">.</span>
            </span>
            <span aria-hidden className="wordmark-sub">
              {rest.join(" ")}
            </span>
          </Link>
        )}
        {/* 오른쪽 버튼이 셋(공유·언어·메뉴)이면 360px 에서 제목 칸이 76px 뿐이라 띄우지 않는다 (히어로가 이미 제목을 보여 준다) */}
        {title && !action && <HeaderTitle text={title} />}
        <div className="ml-auto flex items-center">
          {action}
          <LanguageButton />
          <MenuButton categories={categories} />
        </div>
      </div>
    </header>
  );
}
