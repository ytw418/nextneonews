import { type EventWithView, type Locale, ticketState } from "@kmedia/core";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { PlayIcon, TicketIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { KIND_TINT } from "@/lib/schedule";

// 영어 메모는 영어 화면에서만 보조 줄로
function Note({ text, locale }: { text?: string; locale: Locale }) {
  if (!text || locale !== "en") return null;
  return (
    <span lang="en" className="block">
      {text}
    </span>
  );
}

// 보는 곳·티켓. 링크가 있는 줄만 누를 수 있다 (바깥 화살표). 상태는 배지 하나로만 말한다
export async function WatchTickets({ e, locale }: { e: EventWithView; locale: Locale }) {
  const watch = e.watch ?? [];
  const tickets = e.tickets ?? [];
  if (watch.length === 0 && tickets.length === 0) return null;
  const t = await getTranslations("Schedule");
  const until = new Intl.DateTimeFormat(locale, { timeZone: "UTC", month: "short", day: "numeric" });
  const icon = (glyph: ReactNode) => (
    <span
      className="grid size-9 place-items-center rounded-btn-m text-on-tint"
      style={{ backgroundColor: KIND_TINT[e.kind] }}
    >
      {glyph}
    </span>
  );

  return (
    <section aria-labelledby="watch-tickets">
      <SectionHeader id="watch-tickets" title={t("watchTickets")} />
      <ul>
        {watch.map((w) => (
          <ListRow
            key={`w-${w.name}`}
            href={w.url}
            external={Boolean(w.url)}
            titleWeight="semibold"
            alignTop
            left={icon(<PlayIcon className="size-5" />)}
            title={w.name}
            sub={
              <>
                {t(`mode.${w.mode}`)}
                <Note text={w.note} locale={locale} />
              </>
            }
          />
        ))}
        {tickets.map((ticket) => {
          const state = ticketState(ticket);
          const open = state === "presale" || state === "onSale";
          const deadline =
            state === "presale" && ticket.window
              ? t("until", { date: until.format(new Date(`${ticket.window.to}T00:00:00Z`)) })
              : null;
          return (
            <ListRow
              key={`t-${ticket.name}`}
              href={ticket.url}
              external={Boolean(ticket.url)}
              titleWeight="semibold"
              alignTop
              left={icon(<TicketIcon className="size-5" />)}
              title={ticket.name}
              sub={
                deadline || (ticket.note && locale === "en") ? (
                  <>
                    {deadline}
                    <Note text={ticket.note} locale={locale} />
                  </>
                ) : undefined
              }
              right={<Badge tone={open ? "brandWeak" : "neutral"}>{t(`status.${state}`)}</Badge>}
            />
          );
        })}
      </ul>
    </section>
  );
}
