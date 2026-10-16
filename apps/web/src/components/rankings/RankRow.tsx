"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { ChevronDownIcon } from "@/components/icons";
import { EntityAvatar } from "@/components/rankings/EntityAvatar";
import { RankChange } from "@/components/rankings/RankChange";
import { track } from "@/lib/track";

interface Props {
  chart: string;
  entityId: string;
  rank: number;
  prevRank: number | null;
  name: string;
  subName: string | null;
  subLang?: string;
  score: string;
  avatar: string | null; // 120px 썸네일
  tint: string;
  change?: boolean; // 팬 투표는 보기가 매주 바뀌어 순위 변동을 보이지 않는다
  children: ReactNode; // 펼친 내용 (서버에서 그린다: 막대·출처 숫자·스파크라인·최신 글·일정)
}

// 2~10위 한 줄. 자바스크립트 없이도 열리는 <details> 이고, 열 때만 GA 이벤트를 보낸다.
// 접힌 줄은 72px: 순위(28px 굵게)와 변동 · 48px 원형 사진 · 이름 두 줄 · 오른쪽 점수
export function RankRow({
  chart,
  entityId,
  rank,
  prevRank,
  name,
  subName,
  subLang,
  score,
  avatar,
  tint,
  change = true,
  children,
}: Props) {
  const t = useTranslations("Rankings");
  return (
    <li id={`r-${entityId}`} className="scroll-mt-16 border-b border-line last:border-b-0">
      <details
        className="group"
        onToggle={(event) => {
          if (event.currentTarget.open) track("rank_row_open", { chart, rank, entity_id: entityId });
        }}
      >
        <summary className="press-row flex min-h-18 cursor-pointer list-none items-center gap-3 px-gutter py-2 [&::-webkit-details-marker]:hidden">
          <span className="flex w-9 shrink-0 flex-col items-center gap-1">
            <span className="sr-only">{t("rankLabel", { rank })}</span>
            <span aria-hidden className="text-st2 leading-none font-bold tabular-nums text-ink-900">
              {rank}
            </span>
            {change && <RankChange rank={rank} prevRank={prevRank} />}
          </span>
          <EntityAvatar name={name} src={avatar} tint={tint} size={48} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-t5 leading-row font-bold text-ink-900">{name}</span>
            {subName && (
              <span lang={subLang} className="block truncate text-t7 text-ink-600">
                {subName}
              </span>
            )}
          </span>
          <span className="shrink-0 text-right text-t5 font-bold tabular-nums text-ink-900">
            <span className="sr-only">{t("score")} </span>
            {score}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-ink-400 transition-transform duration-200 ease-expo group-open:rotate-180" />
        </summary>
        <div className="px-gutter pt-1 pb-5">{children}</div>
      </details>
    </li>
  );
}
