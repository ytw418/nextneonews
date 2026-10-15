"use client";

import { timeIn } from "@kmedia/core";
import { useLocale, useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// '내 시간: 오후 6:00'. 보는 사람의 시간대는 브라우저에서만 알 수 있어 서버에서는 그리지 않는다.
// 한국 시간과 같거나 공연장 시각 줄과 같으면 (대만 사람이 AAA 를 볼 때) 띄우지 않는다
export function LocalTime({ date, hhmm, venueTz }: { date: string; hhmm: string; venueTz?: string }) {
  const t = useTranslations("Schedule");
  const locale = useLocale();
  const time = useSyncExternalStore(
    subscribe,
    () => {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const mine = timeIn(locale, date, hhmm, zone);
      if (mine === timeIn(locale, date, hhmm, "Asia/Seoul")) return null;
      if (venueTz && mine === timeIn(locale, date, hhmm, venueTz)) return null;
      return mine;
    },
    () => null,
  );
  if (!time) return null;
  return <span className="block text-t6 font-normal text-ink-700">{t("yourTime", { time })}</span>;
}
