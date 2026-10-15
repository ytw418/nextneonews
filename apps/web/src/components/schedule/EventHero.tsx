import { type EventWithView, formatRange, type Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { CelebrateOnce } from "@/components/schedule/CelebrateOnce";
import { Badge } from "@/components/ui/Badge";
import { DdayBadge } from "@/components/ui/DdayBadge";
import { ddayLabel, KIND_TINT } from "@/lib/schedule";

// 일정 상세 맨 위 큰 티켓 (이 페이지의 그림 하나). 스텁 = 이벤트 틴트 + D-day, 몸통 = 이름과 한 줄 소개
export async function EventHero({ e, locale }: { e: EventWithView; locale: Locale }) {
  const t = await getTranslations("Schedule");
  const { state, days } = e.view;
  const urgent = state === "upcoming" && days <= 7;
  const about = e.about?.[locale];

  return (
    <section className="px-gutter pt-4">
      <div className="overflow-hidden rounded-card bg-card shadow-card">
        <div
          className={`ticket-stub px-5 pt-5 pb-4 ${state === "ended" ? "opacity-60" : ""}`}
          style={{ backgroundColor: KIND_TINT[e.kind] }}
        >
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="paper">{t(`kind.${e.kind}`)}</Badge>
            {/* 오늘·진행 중은 아래 큰 글자가 같은 말을 하니 배지는 끝난 일정에만 */}
            {state === "ended" && <DdayBadge view={e.view} label={t("ended")} />}
          </div>
          {state === "upcoming" && (
            // 날짜 줄(InfoRows)이 '36일 후'를 읽어 주므로 숫자는 화면 읽기에서 뺀다
            <p
              aria-hidden
              className={`mt-3 whitespace-nowrap text-t1 font-bold tabular-nums ${urgent ? "text-brand-ink" : "text-on-tint"}`}
            >
              {ddayLabel(e.view, t)}
            </p>
          )}
          {(state === "today" || state === "ongoing") && (
            <p className="mt-3 text-t1 font-bold text-on-tint">
              {state === "today" ? (
                <CelebrateOnce id={e.id}>
                  <span aria-hidden className="mr-2 inline-block size-2.5 rounded-full bg-cherry align-middle" />
                  {t("today")}
                </CelebrateOnce>
              ) : (
                <>
                  <span aria-hidden className="mr-2 inline-block size-2.5 rounded-full bg-cherry align-middle" />
                  {t("ongoing")}
                </>
              )}
            </p>
          )}
          <p className={`text-t6 font-semibold tabular-nums text-on-tint-sub ${state === "ended" ? "mt-3" : ""}`}>
            {formatRange(locale, e.start, e.end, "long")}
          </p>
        </div>
        <div className="px-5 pt-4 pb-5">
          <h1 className="text-st2 font-bold text-ink-900">{e.name}</h1>
          {about && <p className="mt-1 text-t6 text-ink-700">{about}</p>}
          {state === "today" && (
            <p className="mt-2 text-t5 font-semibold text-brand-ink">
              {t(e.kind === "comeback" ? "todayLine.comeback" : "todayLine.default")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
