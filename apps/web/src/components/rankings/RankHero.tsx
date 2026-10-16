import type { RankingItem } from "@kmedia/core";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Fragment } from "react";

import { CheerButton } from "@/components/rankings/CheerButton";
import { initials } from "@/components/rankings/EntityAvatar";
import { RankChange } from "@/components/rankings/RankChange";
import type { EntityPhoto } from "@/lib/entity-image";

const clamp = (v: number) => Math.max(0, Math.min(100, v));

// 국내 화제(KR)·세계 관심(GL) 두 성분 막대 (0~100). 글자로도 값을 적어 막대 길이만으로 읽지 않게 한다
export function AxisBars({ kr, gl }: { kr: number; gl: number }) {
  const t = useTranslations("Rankings");
  const rows = [
    { key: "kr", short: t("krShort"), label: t("kr"), value: kr, bar: "bg-brand" },
    { key: "gl", short: t("glShort"), label: t("gl"), value: gl, bar: "bg-ink-600" },
  ];
  return (
    <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1.5">
      {rows.map((r) => (
        <Fragment key={r.key}>
          <dt className="text-st12 font-semibold text-ink-600">
            <span aria-hidden>{r.short}</span>
            <span className="sr-only">{r.label}</span>
          </dt>
          <dd aria-hidden className="h-1.5 overflow-hidden rounded-full bg-fill-weak">
            <span className={`block h-full rounded-full ${r.bar}`} style={{ width: `${clamp(r.value)}%` }} />
          </dd>
          <dd className="min-w-6 text-right text-st12 font-semibold tabular-nums text-ink-700">{Math.round(r.value)}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

interface Props {
  chart: string;
  item: RankingItem;
  name: string;
  subName: string | null;
  subLang?: string;
  photo: EntityPhoto | null;
  tint: string;
  score: string;
  cheers: number;
  showAxes: boolean; // 팬 투표 차트에는 KR·GL 성분이 없다
  live: boolean; // 주간 아카이브에는 응원 버튼을 두지 않는다
}

// 1위 카드: 4:5 사진(500px, 화면의 LCP 라 바로 받는다) + 체리색 순위 배지 · 점수 · 변동 · 두 성분 막대 · 응원
export function RankHero({ chart, item, name, subName, subLang, photo, tint, score, cheers, showAxes, live }: Props) {
  const t = useTranslations("Rankings");
  const locale = useLocale();
  const votes = (n: number) => new Intl.NumberFormat(locale).format(n);
  return (
    <section id={`r-${item.entityId}`} aria-labelledby="rank-hero" className="scroll-mt-16 px-gutter pt-4">
      <div className="overflow-hidden rounded-card bg-card shadow-card">
        <div className="flex">
          <div className="relative aspect-[4/5] w-2/5 shrink-0 bg-fill-weak">
            {photo ? (
              <Image
                src={photo.src}
                alt={name}
                fill
                unoptimized
                preload
                sizes="(max-width: 640px) 40vw, 256px"
                className="object-cover object-[50%_20%]"
              />
            ) : (
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center text-t1 font-bold text-on-tint"
                style={{ backgroundColor: tint }}
              >
                {initials(name)}
              </span>
            )}
            <span className="absolute top-2 left-2 inline-flex min-h-7 items-center rounded-badge bg-brand px-2 text-t6 font-bold tabular-nums text-white">
              <span className="sr-only">{t("rankLabel", { rank: item.rank })}</span>
              <span aria-hidden>1</span>
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
            <div>
              <h2 id="rank-hero" className="text-t4 leading-row font-bold break-words text-ink-900">
                {name}
              </h2>
              {subName && (
                <p lang={subLang} className="text-t7 text-ink-600">
                  {subName}
                </p>
              )}
            </div>
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="sr-only">{t("score")} </span>
              <span className="text-t1 font-bold tabular-nums text-ink-900">{score}</span>
              {chart !== "fan-pick" && <RankChange rank={item.rank} prevRank={item.prevRank} />}
            </p>
            {showAxes ? (
              <div className="mt-auto">
                <AxisBars kr={item.kr} gl={item.gl} />
              </div>
            ) : (
              // 팬 투표는 성분 막대 대신 득표 수
              typeof item.metrics?.votes === "number" && (
                <p className="text-t7 text-ink-600">{t("votes", { count: votes(item.metrics.votes) })}</p>
              )
            )}
          </div>
        </div>
        {live && (
          <div className="px-4 pt-3 pb-4">
            <CheerButton entityId={item.entityId} chart={chart} count={cheers} block />
          </div>
        )}
      </div>
    </section>
  );
}
