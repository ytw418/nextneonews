import { getTranslations } from "next-intl/server";

import { HomeIcon, TicketIcon } from "@/components/icons";
import { LanguageSheet } from "@/components/LanguageSheet";
import { Link } from "@/i18n/navigation";

// 엄지가 닿는 하단 탭바 (홈 바 영역만큼 여백). 탭 이름은 14px 에서 멈춰 글자를 키워도 줄 높이가 그대로다
export async function TabBar() {
  const t = await getTranslations("Nav");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 bg-bar pb-[env(safe-area-inset-bottom)] shadow-[inset_0_1px_0_var(--line)] backdrop-blur-xl">
      <div className="mx-auto grid min-h-14 max-w-[640px] grid-cols-3 items-center">
        <Link href="/" className="press flex min-h-12 flex-col items-center justify-center gap-0.5 text-ink-900">
          <HomeIcon />
          <span className="text-chrome-tab font-bold">{t("home")}</span>
        </Link>
        <Link href="/#upcoming" className="press flex min-h-12 flex-col items-center justify-center gap-0.5 text-ink-600">
          <TicketIcon />
          <span className="text-chrome-tab font-semibold">{t("upcoming")}</span>
        </Link>
        <div className="flex justify-center">
          <LanguageSheet label={t("language")} />
        </div>
      </div>
    </nav>
  );
}
