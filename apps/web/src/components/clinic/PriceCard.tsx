import type { Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { ChevronRightIcon, ExternalIcon } from "@/components/icons";
import type { Procedure } from "@/data/clinic/types";
import { Link } from "@/i18n/navigation";

import { hostOf } from "./format";
import { HOW_TO_PATH } from "./MedicalNotice";

// 가격 카드. 공개 통계 출처·기준일이 있는 시술만 범위로 싣고 '병원·부위마다 다름'을 붙인다 (PLAN §7-2).
// 가격이 없는 시술은 그 자리에 싣지 않는 이유와 상담 때 서면으로 받을 것 (BM-VALIDATION P5-1)
export async function PriceCard({ price, locale }: { price: Procedure["price"]; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Clinic" });

  if (!price) {
    const reasons = t.raw("price.noneReasons") as string[];
    return (
      <section aria-labelledby="clinic-price" className="mx-gutter mt-8 rounded-card bg-card p-5 shadow-card">
        <h2 id="clinic-price" className="text-t5 font-bold text-ink-900">
          {t("price.noneTitle")}
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-t6 text-ink-700 marker:text-ink-400">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <Link
          href={`${HOW_TO_PATH}#estimate`}
          className="press -mb-2 mt-1 inline-flex min-h-11 items-center gap-0.5 text-t6 font-semibold text-brand-ink"
        >
          {t("price.howTo")}
          <ChevronRightIcon className="size-4" />
        </Link>
      </section>
    );
  }

  const won = new Intl.NumberFormat(locale, { style: "currency", currency: "KRW", maximumFractionDigits: 0 });
  const [year, month] = price.asOf.split("-").map(Number);
  const asOf = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );

  return (
    <section aria-labelledby="clinic-price" className="mx-gutter mt-8 rounded-card bg-card p-5 shadow-card">
      <h2 id="clinic-price" className="text-t5 font-bold text-ink-900">
        {t("price.title")}
      </h2>
      <p className="mt-2 text-t3 font-bold tabular-nums text-ink-900">
        {won.format(price.lowKrw)}–{won.format(price.highKrw)}
      </p>
      <p className="text-t6 text-ink-600">{t(`price.unit.${price.unit}`)}</p>
      <p className="mt-3 text-t6 text-ink-700">{t("price.varies")}</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-t7 text-ink-600">
        <a
          href={price.source}
          target="_blank"
          rel="noopener noreferrer"
          className="hit inline-flex items-center gap-1 font-semibold text-ink-700 underline underline-offset-4"
        >
          {t("price.source", { host: hostOf(price.source) })}
          <ExternalIcon className="size-3.5" />
          <span className="sr-only">{t("newTab")}</span>
        </a>
        <span>{t("price.asOf", { date: asOf })}</span>
      </p>
    </section>
  );
}
