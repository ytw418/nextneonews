"use client";

import { useTranslations } from "next-intl";

import { HomeFilledIcon, HomeIcon, TicketFilledIcon, TicketIcon } from "@/components/icons";
import { Link, usePathname } from "@/i18n/navigation";

// 실제 목적지만 탭이 된다: 지금은 홈·일정 (가이드가 생기면 세 번째). 언어·설정·더보기는 탭에 두지 않는다
const TABS = [
  { href: "/", key: "home", Icon: HomeIcon, IconOn: HomeFilledIcon },
  { href: "/schedule", key: "schedule", Icon: TicketIcon, IconOn: TicketFilledIcon },
] as const;

// 떠 있는 캡슐 탭바 (2개면 204px). 탭 이름은 14px 에서 멈춰 글자를 키워도 항목이 48px 그대로다.
// 선택은 brand-weak — 아래 크롬에서 체리색이 사는 곳
export function TabBar() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  // 일정 상세는 하단 고정 CTA 가 이 자리를 쓴다
  if (/^\/schedule\/[^/]+/.test(pathname)) return null;
  const selected = pathname.startsWith("/schedule") ? "/schedule" : "/";

  return (
    <nav
      aria-label={t("main")}
      className="fixed bottom-[var(--tabbar-bottom)] left-1/2 z-40 flex min-h-14 -translate-x-1/2 items-center gap-1 rounded-full bg-floating/90 p-1 shadow-float ring-1 ring-line backdrop-blur-xl"
    >
      {TABS.map(({ href, key, Icon, IconOn }) => {
        const on = href === selected;
        return (
          <Link
            key={href}
            href={href}
            // 정확히 그 화면일 때만 (카테고리·글에서는 홈 탭이 선택돼 보여도 현재 페이지는 아니다)
            aria-current={pathname === href ? "page" : undefined}
            className={`press flex min-h-12 min-w-24 flex-col items-center justify-center gap-0.5 rounded-full px-4 ${
              on ? "bg-brand-weak font-bold text-brand-ink" : "font-semibold text-ink-600"
            }`}
          >
            {on ? <IconOn /> : <Icon />}
            <span className="whitespace-nowrap text-chrome-tab">{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
