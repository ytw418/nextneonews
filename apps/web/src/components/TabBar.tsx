"use client";

import { useTranslations } from "next-intl";

import { CompassFilledIcon, CompassIcon } from "@/components/guide/icons";
import { HeartIcon, HomeFilledIcon, HomeIcon } from "@/components/icons";
import { CheerFilledIcon, TrophyFilledIcon, TrophyIcon } from "@/components/rankings/icons";
import { Link, usePathname } from "@/i18n/navigation";

// 실제 목적지만 탭이 된다: 홈·랭킹·가이드·저장. 언어·설정·더보기는 탭에 두지 않는다 (일정은 홈 레일·메뉴로).
// 탭 이름은 기능마다 자기 네임스페이스에 있다 (랭킹 Rankings.tab · 가이드 Guide.tab · 저장 Engage.savedTab)
const TABS = [
  { href: "/", ns: "Nav", key: "home", Icon: HomeIcon, IconOn: HomeFilledIcon },
  { href: "/rankings", ns: "Rankings", key: "tab", Icon: TrophyIcon, IconOn: TrophyFilledIcon },
  { href: "/guide", ns: "Guide", key: "tab", Icon: CompassIcon, IconOn: CompassFilledIcon },
  { href: "/saved", ns: "Engage", key: "savedTab", Icon: HeartIcon, IconOn: CheerFilledIcon },
] as const;

// 가이드 섹션 화면은 가이드 탭에 불을 켠다
const GUIDE_PATH = /^\/(guide|beauty|travel|clinic|drama)(\/|$)/;

// 떠 있는 캡슐 탭바 (4개 × 최소 68px, 양옆 8px — 360px 화면에서 가장 긴 fr 'Classements' 까지 캡슐이 320px 안에 든다).
// 최소 폭은 rem 이 아니라 px: 루트 글자가 17px 인 기기에서 4.5rem(77px)이면 넷이 320px 을 넘었다.
// 탭 이름은 14px 에서 멈춰 글자를 키워도 항목이 48px 그대로다.
// 선택은 brand-weak — 아래 크롬에서 체리색이 사는 곳. 바탕은 거의 불투명(97%): 90% 는 뒤 굵은 제목이 비쳐 보였다
export function TabBar() {
  const t = {
    Nav: useTranslations("Nav"),
    Rankings: useTranslations("Rankings"),
    Guide: useTranslations("Guide"),
    Engage: useTranslations("Engage"),
  };
  const pathname = usePathname();

  // 일정 상세는 하단 고정 CTA 가, 글 화면은 글 액션 바(ArticleActionBar)가 이 자리를 쓴다
  if (/^\/schedule\/[^/]+/.test(pathname) || /^\/news\/[^/]+$/.test(pathname)) return null;
  // 인물 페이지는 랭킹에서 들어가는 화면이라 랭킹 탭에 불을 켠다. 일정은 홈에서 들어가서 홈
  const selected = GUIDE_PATH.test(pathname)
    ? "/guide"
    : pathname.startsWith("/saved")
      ? "/saved"
      : pathname.startsWith("/rankings") || pathname.startsWith("/idol/")
        ? "/rankings"
        : "/";

  return (
    <nav
      aria-label={t.Nav("main")}
      className="fixed bottom-[var(--tabbar-bottom)] left-1/2 z-40 flex min-h-14 -translate-x-1/2 items-center gap-1 rounded-full bg-floating/97 p-1 shadow-float ring-1 ring-line backdrop-blur-xl backdrop-saturate-150"
    >
      {TABS.map(({ href, ns, key, Icon, IconOn }) => {
        const on = href === selected;
        return (
          <Link
            key={href}
            href={href}
            // 정확히 그 화면일 때만 (카테고리·글에서는 홈 탭이 선택돼 보여도 현재 페이지는 아니다)
            aria-current={pathname === href ? "page" : undefined}
            className={`press flex min-h-12 min-w-17 flex-col items-center justify-center gap-0.5 rounded-full px-2 ${
              on ? "bg-brand-weak font-bold text-brand-ink" : "font-semibold text-ink-600"
            }`}
          >
            {on ? <IconOn /> : <Icon />}
            <span className="whitespace-nowrap text-chrome-tab">{t[ns](key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
