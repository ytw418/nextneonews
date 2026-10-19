import type { Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { CheckIcon } from "@/components/icons";
import { ListRow } from "@/components/ui/ListRow";
import type { Drama } from "@/data/drama/types";
import { PLATFORM_NAME, type WatchAvailability, watchAvailability } from "@/lib/drama";

// '어디서 보나': 플랫폼 공식 작품 페이지로 가는 일반 링크(제휴 아님, 새 탭). 줄마다 지역 확인 상태 —
// 공식 자료(regions)가 이 언어 독자 지역을 적었을 때만 '여기서 볼 수 있어요', 아니면 '나라마다 다름 · 확인 전'
export async function WatchList({ watch, locale }: { watch: Drama["watch"]; locale: Locale }) {
  if (watch.length === 0) return null;
  const [t, tDrama] = await Promise.all([
    getTranslations({ locale, namespace: "Drama.detail" }),
    getTranslations({ locale, namespace: "Drama" }),
  ]);
  const regionName = new Intl.DisplayNames([locale], { type: "region", style: "short" });
  const list = new Intl.ListFormat(locale, { type: "conjunction" });

  const label = (a: WatchAvailability): string => {
    if (a.state === "everywhere") return t("watchEverywhere");
    if (a.state === "unconfirmed") return t("watchUnconfirmed");
    return t("watchConfirmed", { regions: list.format(a.regions.map((r) => regionName.of(r.toUpperCase()) ?? r)) });
  };

  return (
    <section aria-labelledby="drama-watch" className="mx-gutter mt-3 rounded-card bg-card pt-4 pb-2 shadow-card">
      <h2 id="drama-watch" className="px-4 text-t6 font-bold text-ink-900">
        {t("watchTitle")}
      </h2>
      <ul className="mt-1">
        {watch.map((w) => {
          const name = PLATFORM_NAME[w.platform];
          const availability = watchAvailability(locale, w.regions);
          const text = label(availability);
          return (
            <ListRow
              key={w.platform}
              inset="card"
              href={w.url}
              external={!!w.url}
              ariaLabel={w.url ? `${name}: ${text} ${tDrama("newTab")}` : undefined}
              title={name}
              sub={
                <span className="inline-flex items-center gap-1">
                  {availability.state !== "unconfirmed" && <CheckIcon className="size-4 shrink-0 text-ink-700" />}
                  {text}
                </span>
              }
            />
          );
        })}
      </ul>
      <p className="px-4 pt-1 pb-2 text-st12 text-ink-600">{t("watchNote")}</p>
    </section>
  );
}
