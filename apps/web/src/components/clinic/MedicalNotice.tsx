import type { Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { ChevronRightIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";

export const HOW_TO_PATH = "/clinic/how-to-choose";

// 클리닉 모든 화면 맨 위(시술 화면은 끝에도 한 번 더)의 의료 고지 (의료법 §56·PLAN §7-4).
// 의료 조언·병원 알선이 아니고, 병원별 정보·후기·순위를 싣지 않으며, 병원·예약 서비스와 관계없는 독립 매체라고 먼저 말한다
export async function MedicalNotice({
  locale,
  withHowTo = true,
  repeat = false,
  className = "",
}: {
  locale: Locale;
  withHowTo?: boolean; // 고르는 법 화면 자신에서는 링크를 뺀다
  repeat?: boolean; // 같은 화면 아래쪽에 한 번 더 보일 때: 같은 이름의 랜드마크가 둘이 되지 않게 일반 div 로 그린다
  className?: string;
}) {
  const t = await getTranslations({ locale, namespace: "Clinic" });
  const Tag = repeat ? "div" : "aside";
  return (
    <Tag
      aria-label={repeat ? undefined : t("notice.title")}
      className={`mx-gutter rounded-card bg-band px-4 py-3 text-t7 text-ink-700 ${className}`}
    >
      <p>
        <strong className="font-semibold text-ink-900">{t("notice.body")}</strong> {t("notice.independent")}
      </p>
      {withHowTo && (
        <Link
          href={HOW_TO_PATH}
          className="press -mb-1 mt-1 inline-flex min-h-11 items-center gap-0.5 font-semibold text-brand-ink"
        >
          {t("notice.howTo")}
          <ChevronRightIcon className="size-4" />
        </Link>
      )}
    </Tag>
  );
}
