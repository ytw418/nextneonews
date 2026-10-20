import { formatRange, isLocale, listUpcoming } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { ChevronRightIcon } from "@/components/icons";
import { CelebrateOnce } from "@/components/schedule/CelebrateOnce";
import { keepDots, Meta } from "@/components/ui/Meta";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Link } from "@/i18n/navigation";
import { ddayLabel, eventAriaLabel } from "@/lib/schedule";

// 콘서트 티켓 모양의 일정 레일 (다가오는 5개). 스텁은 임박(7일 안·오늘·진행 중)이면 브랜드 핑크, 아니면 회색. 티켓을 누르면 일정 상세로.
// 가로 스크롤 상자는 세로도 잘라서, 카드 그림자가 잘리지 않게 아래 여백을 12px 둔다.
// 꺾쇠는 모든 카드에서 같은 자리(오른쪽 아래 구석)에: 메타 줄 끝에 붙이면 카드마다 높이가 달랐다
export async function UpcomingRail({ locale }: { locale: string }) {
  if (!isLocale(locale)) return null;
  const events = listUpcoming().slice(0, 5);
  if (events.length === 0) return null;
  const [t, tNav, tHome] = await Promise.all([
    getTranslations("Schedule"),
    getTranslations("Nav"),
    getTranslations("Home"),
  ]);

  return (
    <section aria-labelledby="home-schedule">
      <SectionHeader id="home-schedule" title={tNav("schedule")} href="/schedule" linkLabel={tHome("seeAll")} />
      <ul className="rail rail-snap items-stretch gap-2 px-gutter pb-3">
        {events.map((e) => {
          const { state, days } = e.view;
          const urgent = state === "upcoming" && days <= 7;
          // 오늘·진행 중·7일 안: 스텁을 브랜드 핑크로 채운다 (홈에서 색 블록은 '임박'에만). 나머지는 회색
          const hot = urgent || state !== "upcoming";
          const city = e.city?.[locale];
          const meta = [
            t(`kind.${e.kind}`),
            city,
            e.releases?.length ? t("releaseCount", { count: e.releases.length }) : undefined,
          ];
          const word = (
            <>
              <span className="mr-1.5 inline-block size-2 rounded-full bg-white align-middle" />
              {ddayLabel(e.view, t)}
            </>
          );
          return (
            <li
              key={e.id}
              className="w-[min(max(9rem,calc((min(100vw,640px)-36px)/2.25)),calc(100vw-56px))]"
            >
              <Link
                href={`/schedule/${e.id}`}
                aria-label={eventAriaLabel({ e, view: e.view, locale, t })}
                className="press relative flex h-full flex-col overflow-hidden rounded-card bg-card shadow-card"
              >
                <div
                  aria-hidden
                  className={`ticket-stub flex flex-col px-4 pt-4 pb-3 ${hot ? "bg-brand text-white" : "bg-band text-on-tint"}`}
                >
                  {state === "upcoming" ? (
                    <p
                      className="whitespace-nowrap text-t3 font-bold tabular-nums"
                    >
                      {ddayLabel(e.view, t)}
                    </p>
                  ) : (
                    // '오늘'·'진행 중'은 t5 로 (줄이 바뀌어도 잘리지 않게). 바깥 p 가 t3 줄 높이를 지켜 스텁 높이가 맞는다
                    <p className="text-t3 font-bold">
                      <span className="text-t5">
                        {state === "today" ? <CelebrateOnce id={e.id}>{word}</CelebrateOnce> : word}
                      </span>
                    </p>
                  )}
                  <p className={`text-t6 font-semibold tabular-nums ${hot ? "text-white/85" : "text-on-tint-sub"}`}>
                    {formatRange(locale, e.start, e.end, "short")}
                  </p>
                </div>
                <div aria-hidden className="flex flex-1 flex-col px-4 pt-3 pb-4">
                  <p className="text-t5 leading-row font-bold text-ink-900">{keepDots(e.name)}</p>
                  <p className="mt-1 pr-4 text-t6 text-ink-600">
                    <Meta parts={meta} />
                  </p>
                </div>
                <ChevronRightIcon className="absolute right-3 bottom-4.5 size-4 text-ink-400" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
