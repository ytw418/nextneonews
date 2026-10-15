import { getTranslations } from "next-intl/server";

import { HomeIcon, TicketIcon } from "@/components/icons";
import { LanguageSheet } from "@/components/LanguageSheet";
import { Link } from "@/i18n/navigation";

// 엄지가 닿는 하단 탭바 (홈 바 영역만큼 여백)
export async function TabBar() {
  const t = await getTranslations("Nav");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-[var(--bar)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto grid h-[var(--tabbar-h)] max-w-[640px] grid-cols-3 items-center">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-fg">
          <HomeIcon />
          <span className="text-[10.5px] font-semibold">{t("home")}</span>
        </Link>
        <Link href="/#upcoming" className="flex flex-col items-center gap-0.5 text-muted">
          <TicketIcon />
          <span className="text-[10.5px] font-semibold">{t("upcoming")}</span>
        </Link>
        <div className="flex justify-center">
          <LanguageSheet label={t("language")} />
        </div>
      </div>
    </nav>
  );
}
