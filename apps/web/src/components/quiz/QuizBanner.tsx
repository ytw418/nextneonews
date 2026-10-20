import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

// 피부 타입 진단으로 보내는 가로 배너 (홈 피드·가이드). 피드에서 핑크로 채운 버튼은 이것 하나뿐이다.
// 광고 승인 전에는 홈 첫 광고 자리를 이 배너가 채운다 (AdSlot fallback)
export async function QuizBanner({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Beauty" });
  return (
    <Link
      href="/beauty/skin-type"
      className="press-soft my-3 flex items-center gap-3.5 rounded-card bg-band py-4 pr-4 pl-3.5"
    >
      <Image src="/icons3d/kbeauty.webp" unoptimized alt="" width={56} height={56} className="size-14 shrink-0" />
      <span className="min-w-0 grow">
        <span className="block text-t5 font-bold text-ink-900">{t("quizBanner.title")}</span>
        <span className="block text-st12 font-medium text-ink-600">{t("quizBanner.sub")}</span>
      </span>
      <span className="inline-flex min-h-9 shrink-0 items-center rounded-full bg-brand px-3.5 text-t7 font-bold text-white">
        {t("quizBanner.cta")}
      </span>
    </Link>
  );
}
