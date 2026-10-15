import { type EventWithView, formatKstTime, kst, type Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { ListRow } from "@/components/ui/ListRow";
import { Meta } from "@/components/ui/Meta";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { KIND_TINT } from "@/lib/schedule";

// 출연 팀 칩. 누르는 것이 아니라서 버튼 모양을 쓰지 않는다.
// 회색 대신 일정 종류 틴트 (티켓 스텁과 같은 색) — 팬 화면답게
function Acts({ acts, tint }: { acts: string[]; tint: string }) {
  return (
    <ul className="flex flex-wrap gap-1.5 px-gutter">
      {acts.map((act) => (
        <li
          key={act}
          className="inline-flex min-h-7 items-center rounded-badge px-2.5 text-t7 font-semibold text-on-tint"
          style={{ backgroundColor: tint }}
        >
          {act}
        </li>
      ))}
    </ul>
  );
}

// 출연진(날짜별) 또는 컴백 발매 목록. 발표된 것만, 일부일 수 있다고 함께 적는다
export async function Lineup({ e, locale }: { e: EventWithView; locale: Locale }) {
  const t = await getTranslations("Schedule");
  const dayFormat = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Seoul",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const shortDate = new Intl.DateTimeFormat(locale, { timeZone: "Asia/Seoul", month: "short", day: "numeric" });
  const hasActs = Boolean(e.days?.length || e.lineup?.length);

  return (
    <>
      {e.releases && e.releases.length > 0 && (
        <section aria-labelledby="releases">
          <SectionHeader id="releases" title={t("releases")} />
          <ul>
            {e.releases.map((r) => (
              <ListRow
                key={`${r.act}-${r.title}`}
                titleWeight="semibold"
                title={r.act}
                sub={
                  <>
                    <Meta
                      parts={[
                        r.title,
                        r.kind && t(`releaseKind.${r.kind}`),
                        r.date && shortDate.format(kst(r.date)),
                        r.date && r.timeKst && formatKstTime(locale, r.date, r.timeKst),
                      ]}
                    />
                    {r.note && locale === "en" && (
                      <span lang="en" className="block">
                        {r.note}
                      </span>
                    )}
                  </>
                }
              />
            ))}
          </ul>
        </section>
      )}

      {hasActs && (
        <section aria-labelledby="lineup">
          <SectionHeader id="lineup" title={t("lineup")} />
          {e.days?.map((day, i) => (
            <div key={day.date} className={i > 0 ? "mt-3" : ""}>
              <h3 className="px-gutter pt-3 pb-2 text-t6 font-semibold text-ink-600">
                {t("dayN", { n: i + 1, date: dayFormat.format(kst(day.date)) })}
              </h3>
              {day.hosts && day.hosts.length > 0 && (
                <p className="px-gutter pb-2 text-t6 text-ink-700">{t("hosts", { names: day.hosts.join(", ") })}</p>
              )}
              <Acts acts={day.acts} tint={KIND_TINT[e.kind]} />
            </div>
          ))}
          {e.lineup && e.lineup.length > 0 && (
            <div className={e.days?.length ? "mt-3" : ""}>
              <p className="px-gutter pt-3 pb-2 text-t7 text-ink-600">{t("lineupTba")}</p>
              <Acts acts={e.lineup} tint={KIND_TINT[e.kind]} />
            </div>
          )}
          {(e.lineupPartial ?? true) && <p className="px-gutter pt-2 text-t7 text-ink-600">{t("lineupPartial")}</p>}
        </section>
      )}
    </>
  );
}
