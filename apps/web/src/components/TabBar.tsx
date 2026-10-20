"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

import { CompassFilledIcon, CompassIcon } from "@/components/guide/icons";
import {
  BookmarkFilledIcon,
  BookmarkIcon,
  HomeFilledIcon,
  HomeIcon,
  TicketFilledIcon,
  TicketIcon,
} from "@/components/icons";
import { TrophyFilledIcon, TrophyIcon } from "@/components/rankings/icons";
import { Link, usePathname } from "@/i18n/navigation";
import { useSaved } from "@/lib/saved";

// 실제 목적지만 탭이 된다: 홈·랭킹·가이드(가운데)·일정·저장. 언어·설정·더보기는 탭에 두지 않는다.
// 일정(D-day 티켓)은 이 서비스의 차별점이라 메뉴 안에 두지 않고 탭으로 꺼냈다.
// 탭 이름은 기능마다 자기 네임스페이스에 있다 (랭킹 Rankings.tab · 가이드 Guide.tab · 저장 Engage.savedTab).
// 저장 탭은 북마크(하트는 글 반응 전용)
const TABS = [
  { href: "/", ns: "Nav", key: "home", Icon: HomeIcon, IconOn: HomeFilledIcon },
  { href: "/rankings", ns: "Rankings", key: "tab", Icon: TrophyIcon, IconOn: TrophyFilledIcon },
  { href: "/guide", ns: "Guide", key: "tab", Icon: CompassIcon, IconOn: CompassFilledIcon },
  { href: "/schedule", ns: "Nav", key: "schedule", Icon: TicketIcon, IconOn: TicketFilledIcon },
  { href: "/saved", ns: "Engage", key: "savedTab", Icon: BookmarkIcon, IconOn: BookmarkFilledIcon },
] as const;

// 가이드 섹션 화면은 가이드 탭에 불을 켠다
const GUIDE_PATH = /^\/(guide|beauty|travel|clinic|drama)(\/|$)/;
// 저장 수 배지는 두 자리까지 (그 위는 99+)
const BADGE_MAX = 99;
// 저장 탭은 미리 받지 않는다: 탭바는 거의 모든 화면에 있어서, 미리 받으면 저장함 전용 JS 를 모든 독자가 받았다
// (저장함은 기기 목록을 읽어 클라이언트가 그리는 화면이라 미리 받아도 빨라지는 게 적다)
const NO_PREFETCH = new Set(["/saved"]);
// 데이터 절약(Save-Data)을 켠 기기는 어느 탭도 미리 받지 않는다 (누를 때 받는다)
const noSubscribe = () => () => {};
const saveData = () => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

// 화면 아래에 붙은 풀폭 5탭 (강남언니·여신티켓과 같은 문법 — 일본 독자에게 '앱' 으로 읽힌다).
// 선택은 검정 + 채운 아이콘, 나머지는 회색. 핑크는 탭에서 빼서 피드의 핑크(버튼·임박 일정)가 서게 한다.
// 탭 이름은 14px 에서 멈춰 글자를 키워도 줄 높이가 그대로다.
// 저장 탭 아이콘 오른쪽 위에 이 기기 저장 수 배지 (0 이면 없음). 화면 읽기는 탭 이름에 개수를 붙여 읽는다
export function TabBar() {
  const t = {
    Nav: useTranslations("Nav"),
    Rankings: useTranslations("Rankings"),
    Guide: useTranslations("Guide"),
    Engage: useTranslations("Engage"),
  };
  const pathname = usePathname();
  const savedCount = useSaved().length;
  const lite = useSyncExternalStore(noSubscribe, saveData, () => false);

  // 일정 상세는 하단 고정 CTA 가, 글 화면은 글 액션 바(ArticleActionBar)가 이 자리를 쓴다
  if (/^\/schedule\/[^/]+/.test(pathname) || /^\/news\/[^/]+$/.test(pathname)) return null;
  // 인물 페이지는 랭킹에서 들어가는 화면이라 랭킹 탭에 불을 켠다
  const selected = GUIDE_PATH.test(pathname)
    ? "/guide"
    : pathname.startsWith("/schedule")
      ? "/schedule"
      : pathname.startsWith("/saved")
      ? "/saved"
      : pathname.startsWith("/rankings") || pathname.startsWith("/idol/")
        ? "/rankings"
        : "/";

  return (
    <nav
      aria-label={t.Nav("main")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bar pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-[640px]">
      {TABS.map(({ href, ns, key, Icon, IconOn }) => {
        const on = href === selected;
        const badge = href === "/saved" && savedCount > 0 ? savedCount : 0;
        return (
          <Link
            key={href}
            href={href}
            prefetch={lite || NO_PREFETCH.has(href) ? false : undefined}
            // 정확히 그 화면일 때만 (카테고리·글에서는 홈 탭이 선택돼 보여도 현재 페이지는 아니다)
            aria-current={pathname === href ? "page" : undefined}
            aria-label={badge > 0 ? t.Engage("savedTabCount", { count: badge }) : undefined}
            className={`press flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 ${
              on ? "font-bold text-ink-900" : "font-semibold text-ink-400"
            }`}
          >
            <span className="relative">
              {on ? <IconOn /> : <Icon />}
              {badge > 0 && (
                <span
                  aria-hidden
                  className="absolute -top-1.5 left-3.5 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-st13 leading-none font-bold tabular-nums text-white ring-2 ring-bg"
                >
                  {badge > BADGE_MAX ? `${BADGE_MAX}+` : badge}
                </span>
              )}
            </span>
            <span className="max-w-full truncate text-chrome-tab">{t[ns](key)}</span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
