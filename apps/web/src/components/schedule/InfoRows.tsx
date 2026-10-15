import { type EventWithView, formatKstTime, formatRange, type Locale, timeIn } from "@kmedia/core";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { ExternalIcon } from "@/components/icons";
import { LocalTime } from "@/components/schedule/LocalTime";
import { relativeDays } from "@/lib/schedule";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// 이름표·값 한 줄. 너비를 rem 으로 둬서 글자를 키우면 이름표가 값 위로 올라간다
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 px-gutter py-3">
      <dt className="w-[5.5rem] shrink-0 text-t6 text-ink-600">{label}</dt>
      <dd className="min-w-[12rem] flex-1 text-t6 font-medium text-ink-900">{children}</dd>
    </div>
  );
}

// 글줄 안의 링크라 줄 높이는 그대로 두고, 세로 여백으로 누를 자리(44px 가까이)만 넓힌다. 긴 공연장 이름은 줄이 바뀌고 아이콘이 끝 글자 옆에 붙는다
const LINK = "py-2.5 underline-offset-4 active:underline";
const LINK_ICON = "ml-1 inline-block size-4 align-[-2px] text-ink-400";

// 일정 핵심 정보: 날짜·시간·장소·공식 사이트. 모르는 값은 그 줄을 빼거나 '아직 발표 전'이라고 쓴다
export async function InfoRows({ e, locale }: { e: EventWithView; locale: Locale }) {
  const t = await getTranslations("Schedule");
  const city = e.city?.[locale];
  const venueTz = e.tz && e.tz !== "Asia/Seoul" ? e.tz : undefined;

  return (
    <dl className="mt-6">
      <Row label={t("row.date")}>
        <span className="tabular-nums">{formatRange(locale, e.start, e.end, "full")}</span>
        {e.view.state === "upcoming" && <span className="sr-only">, {relativeDays(locale, e.view.days)}</span>}
      </Row>
      {/* 컴백은 팀마다 시각이 달라 발매 목록에 적는다 */}
      {!(e.releases?.length && !e.startTimeKst) && (
        <Row label={t("row.time")}>
          {e.startTimeKst ? (
            <>
              <span className="tabular-nums">{formatKstTime(locale, e.start, e.startTimeKst)}</span>
              {venueTz && city && (
                <span className="block font-normal text-ink-700">
                  {t("venueTime", { city, time: timeIn(locale, e.start, e.startTimeKst, venueTz) })}
                </span>
              )}
              <LocalTime date={e.start} hhmm={e.startTimeKst} venueTz={venueTz} />
            </>
          ) : (
            <span className="font-normal text-ink-600">{t("tba")}</span>
          )}
        </Row>
      )}
      {e.venue && (
        <Row label={t("row.venue")}>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([e.venue, e.city?.en].filter(Boolean).join(", "))}`}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK}
          >
            {e.venue}
            <ExternalIcon className={LINK_ICON} />
          </a>
          {city && <span className="block font-normal text-ink-600">{city}</span>}
        </Row>
      )}
      {e.officialUrl && (
        <Row label={t("row.official")}>
          <a href={e.officialUrl} target="_blank" rel="noopener noreferrer" className={LINK}>
            {hostname(e.officialUrl)}
            <ExternalIcon className={LINK_ICON} />
          </a>
        </Row>
      )}
    </dl>
  );
}
