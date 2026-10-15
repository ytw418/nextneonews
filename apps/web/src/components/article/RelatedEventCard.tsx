import { type EventWithView, formatRange, type Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { DdayBadge } from "@/components/ui/DdayBadge";
import { ListRow } from "@/components/ui/ListRow";
import { keepDots, Meta } from "@/components/ui/Meta";
import { ddayLabel, eventAriaLabel, KIND_TINT } from "@/lib/schedule";

// 글에 나오는 다가오는 일정 하나를 요약 밑에 카드 한 줄로 (누르면 일정 상세).
// 카드는 읽기 열(24px) 위에, 줄 안쪽 여백은 16px(card) → 내용은 x=40 에서 시작한다.
// 날짜 칸 색은 일정 종류(이벤트 틴트). 글자가 커져도 잘리지 않게 크기는 min 으로만 준다
export async function RelatedEventCard({ e, locale }: { e: EventWithView; locale: Locale }) {
  const t = await getTranslations("Schedule");
  // 컴백·드라마처럼 도시가 없는 일정은 종류를 대신 보여 준다
  const sub = [formatRange(locale, e.start, e.end, "short"), e.city?.[locale] ?? t(`kind.${e.kind}`)];

  return (
    <div className="mx-read mt-6 overflow-hidden rounded-card bg-card shadow-card">
      <ul>
        <ListRow
          inset="card"
          href={`/schedule/${e.id}`}
          ariaLabel={eventAriaLabel({ e, view: e.view, locale, t })}
          left={
            <span
              aria-hidden
              className="grid min-h-9 min-w-9 place-items-center rounded-btn-m px-1 text-t6 font-bold tabular-nums text-on-tint"
              style={{ backgroundColor: KIND_TINT[e.kind] }}
            >
              {Number(e.start.slice(8, 10))}
            </span>
          }
          title={keepDots(e.name)}
          sub={<Meta parts={sub} />}
          right={<DdayBadge view={e.view} label={ddayLabel(e.view, t)} />}
          arrow
        />
      </ul>
    </div>
  );
}
