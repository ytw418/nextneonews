"use client";

import { useTranslations } from "next-intl";

import { HomeFilledIcon, HomeIcon, TicketFilledIcon, TicketIcon } from "@/components/icons";
import { TrophyFilledIcon, TrophyIcon } from "@/components/rankings/icons";
import { Link, usePathname } from "@/i18n/navigation";

// 실제 목적지만 탭이 된다: 홈·랭킹·일정. 언어·설정·더보기는 탭에 두지 않는다.
// 랭킹 탭 이름은 Rankings 네임스페이스에 있다 (기능마다 자기 문구 파일만 고친다)
const TABS = [
  { href: "/", ns: "Nav", key: "home", Icon: HomeIcon, IconOn: HomeFilledIcon },
  { href: "/rankings", ns: "Rankings", key: "tab", Icon: TrophyIcon, IconOn: TrophyFilledIcon },
  { href: "/schedule", ns: "Nav", key: "schedule", Icon: TicketIcon, IconOn: TicketFilledIcon },
] as const;

// 떠 있는 캡슐 탭바 (3개면 304px — 360px 화면에 양옆 28px 씩 남는다). 탭 이름은 14px 에서 멈춰 글자를 키워도 항목이 48px 그대로다.
// 선택은 brand-weak — 아래 크롬에서 체리색이 사는 곳. 바탕은 거의 불투명(97%): 90% 는 뒤 굵은 제목이 비쳐 보였다
export function TabBar() {
  const t = { Nav: useTranslations("Nav"), Rankings: useTranslations("Rankings") };
  const pathname = usePathname();

  // 일정 상세는 하단 고정 CTA 가, 글 화면은 글 액션 바(ArticleActionBar)가 이 자리를 쓴다
  if (/^\/schedule\/[^/]+/.test(pathname) || /^\/news\/[^/]+$/.test(pathname)) return null;
  const selected = pathname.startsWith("/schedule") ? "/schedule" : pathname.startsWith("/rankings") ? "/rankings" : "/";

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
            className={`press flex min-h-12 min-w-24 flex-col items-center justify-center gap-0.5 rounded-full px-3 ${
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
