import type { WikiLang } from "@kmedia/core";
import { getTranslations } from "next-intl/server";
import { Fragment } from "react";

import { SectionHeader } from "@/components/ui/SectionHeader";
import type { LanguageViews } from "@/lib/entities";

// 언어별 관심도: 위키백과 언어별 최근 30일 조회를 막대로 (우리만 가진 숫자). 읽는 사람의 언어는 브랜드색 막대.
// 막대 길이만으로 읽지 않게 숫자를 함께 적는다. 위키 언어는 나라가 아니라서 그 점을 밑에 밝힌다
export async function LanguageInterest({
  rows,
  locale,
  readerLang,
}: {
  rows: LanguageViews[];
  locale: string;
  readerLang: WikiLang;
}) {
  if (rows.length === 0) return null;
  const t = await getTranslations("Idol");
  const languages = new Intl.DisplayNames([locale], { type: "language" });
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const max = rows[0]!.views;
  const total = rows.reduce((sum, r) => sum + r.views, 0);

  return (
    <section aria-labelledby="idol-interest">
      <SectionHeader id="idol-interest" title={t("interestTitle")} />
      <p className="-mt-2 px-gutter pb-3 text-t7 text-ink-600">
        {t("interestLead", { count: compact.format(total) })}
      </p>
      <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2.5 px-gutter">
        {rows.map((r) => {
          const mine = r.lang === readerLang;
          return (
            <Fragment key={r.lang}>
              <dt className={`text-t7 ${mine ? "font-bold text-ink-900" : "font-semibold text-ink-700"}`}>
                {languages.of(r.lang) ?? r.lang}
              </dt>
              <dd aria-hidden className="h-2 overflow-hidden rounded-full bg-fill-weak">
                <span
                  className={`block h-full rounded-full ${mine ? "bg-brand" : "bg-ink-600"}`}
                  style={{ width: `${Math.max(2, (r.views / max) * 100)}%` }}
                />
              </dd>
              <dd className="text-right text-t7 font-semibold tabular-nums text-ink-700">{compact.format(r.views)}</dd>
            </Fragment>
          );
        })}
      </dl>
      <p className="px-gutter pt-3 text-st12 text-ink-600">{t("interestNote")}</p>
    </section>
  );
}
