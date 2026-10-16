import type { ChartId, RankingItem } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { ChevronRightIcon } from "@/components/icons";
import { CheerButton } from "@/components/rankings/CheerButton";
import { EntityAvatar } from "@/components/rankings/EntityAvatar";
import { AxisBars } from "@/components/rankings/RankHero";
import { RankChange } from "@/components/rankings/RankChange";
import { RankRow } from "@/components/rankings/RankRow";
import { Sparkline } from "@/components/rankings/Sparkline";
import { Link } from "@/i18n/navigation";
import {
  CHART_TINT,
  displayName,
  formatScore,
  metric,
  nextEventFor,
  type RankEntity,
  scoreSeries,
  secondaryName,
  type Snapshot,
  topWikiLangs,
} from "@/lib/rankings";

interface Props {
  chart: ChartId;
  locale: string;
  items: RankingItem[]; // 2위부터
  entities: Map<string, RankEntity>;
  history: Snapshot[]; // 최근 30일 매일판 (스파크라인)
  cheers: Map<string, number>;
  articles: Map<string, { slug: string; title: string }>;
  showAxes: boolean;
  live: boolean; // 최신 차트만: 응원·최신 글·다음 일정·30일 선 (주간 아카이브는 그 주 그대로 둔다)
}

const EXPANDED_UNTIL = 10; // 2~10위는 펼치는 줄, 11~30위는 표

// 2~10위 펼치는 줄 + 11~30위 표. 펼친 내용은 모두 서버에서 그려 HTML 에 들어 있다 (검색·AI 수집기가 읽는다)
export async function RankingList({ chart, locale, items, entities, history, cheers, articles, showAxes, live }: Props) {
  const t = await getTranslations("Rankings");
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const languages = new Intl.DisplayNames([locale], { type: "language" });
  const tint = CHART_TINT[chart];
  const subLang = locale === "ko" ? "en" : "ko";

  const rows = items.filter((i) => i.rank <= EXPANDED_UNTIL);
  const table = items.filter((i) => i.rank > EXPANDED_UNTIL);

  return (
    <>
      {rows.length > 0 && (
        <ol className="mt-4">
          {rows.map((item) => {
            const entity = entities.get(item.entityId);
            const name = displayName(item.names, locale, item.entityId);
            const posts = metric(item, "theqoo:posts");
            const views = metric(item, "theqoo:views");
            const trends = metric(item, "trends");
            const yonhap = metric(item, "yonhap");
            const votes = metric(item, "votes");
            const wiki = topWikiLangs(item);
            const series = scoreSeries(history, item.entityId);
            const article = articles.get(item.entityId);
            const event = live ? nextEventFor(item.names) : undefined;
            const facts = [
              (posts || views) &&
                t("theqoo", { posts: compact.format(posts ?? 0), views: compact.format(views ?? 0) }),
              trends && t("trends", { value: compact.format(trends) }),
              yonhap && t("yonhap", { count: compact.format(yonhap) }),
              wiki.length > 0 &&
                `${t("wiki")}: ${wiki.map((w) => `${languages.of(w.lang) ?? w.lang} ${compact.format(w.views)}`).join(" · ")}`,
              votes && t("votes", { count: compact.format(votes) }),
            ].filter((f): f is string => typeof f === "string");

            return (
              <RankRow
                key={item.entityId}
                chart={chart}
                entityId={item.entityId}
                rank={item.rank}
                prevRank={item.prevRank}
                name={name}
                subName={secondaryName(item.names, locale)}
                subLang={subLang}
                score={formatScore(item.score, locale)}
                avatar={entity?.photo?.avatar ?? null}
                tint={tint}
                change={chart !== "fan-pick"}
              >
                <div className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-card">
                  {showAxes && <AxisBars kr={item.kr} gl={item.gl} />}
                  {facts.length > 0 && (
                    <ul className="flex flex-col gap-1 text-t7 text-ink-700">
                      {facts.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  )}
                  {series.filter((v) => v !== null).length >= 2 && (
                    <figure>
                      <figcaption className="pb-1 text-st12 font-semibold text-ink-600">{t("trend30")}</figcaption>
                      <Sparkline values={series} label={t("trend30")} />
                    </figure>
                  )}
                  {(article || event) && (
                    <ul className="flex flex-col gap-2 text-t7">
                      {article && (
                        <li>
                          <span className="block text-st12 font-semibold text-ink-600">{t("latestStory")}</span>
                          <Link href={`/news/${article.slug}`} className="font-semibold text-brand-ink underline-offset-2 hover:underline">
                            {article.title}
                          </Link>
                        </li>
                      )}
                      {event && (
                        <li>
                          <span className="block text-st12 font-semibold text-ink-600">{t("nextUp")}</span>
                          <Link href={`/schedule/${event.id}`} className="font-semibold text-brand-ink underline-offset-2 hover:underline">
                            {event.name}
                          </Link>
                        </li>
                      )}
                    </ul>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {live && <CheerButton entityId={item.entityId} chart={chart} count={cheers.get(item.entityId) ?? 0} />}
                    {entity?.slug && (
                      <Link
                        href={`/idol/${entity.slug}`}
                        className="press -my-2 inline-flex min-h-11 items-center gap-0.5 text-t6 font-semibold text-ink-700"
                      >
                        {t("profile")}
                        <ChevronRightIcon className="size-4 text-ink-400" />
                      </Link>
                    )}
                  </div>
                </div>
              </RankRow>
            );
          })}
        </ol>
      )}

      {table.length > 0 && (
        <div className="px-gutter pt-6">
          <table className="w-full border-collapse text-t6">
            <caption className="pb-2 text-left text-t6 font-semibold text-ink-600">
              {t("tableCaption", { from: table[0]!.rank, to: table[table.length - 1]!.rank })}
            </caption>
            <thead>
              <tr className="border-b border-line text-st12 text-ink-600">
                <th scope="col" className="w-10 py-2 text-left font-semibold">
                  {t("colRank")}
                </th>
                <th scope="col" className="py-2 text-left font-semibold">
                  {t("colName")}
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  {t("colScore")}
                </th>
                <th scope="col" className="w-14 py-2 text-right font-semibold">
                  {t("colChange")}
                </th>
              </tr>
            </thead>
            <tbody>
              {table.map((item) => {
                const name = displayName(item.names, locale, item.entityId);
                return (
                  <tr key={item.entityId} id={`r-${item.entityId}`} className="scroll-mt-16 border-b border-line last:border-b-0">
                    <td className="py-2 font-bold tabular-nums text-ink-900">{item.rank}</td>
                    <th scope="row" className="py-2 text-left font-semibold text-ink-900">
                      <span className="flex min-w-0 items-center gap-2">
                        <EntityAvatar name={name} src={entities.get(item.entityId)?.photo?.mini} tint={tint} size={32} />
                        <span className="min-w-0 truncate">{name}</span>
                      </span>
                    </th>
                    <td className="py-2 text-right tabular-nums text-ink-700">{formatScore(item.score, locale)}</td>
                    <td className="py-2 text-right">
                      <RankChange rank={item.rank} prevRank={item.prevRank} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
