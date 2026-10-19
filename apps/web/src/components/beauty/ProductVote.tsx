"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { type ItemTotals, useItemVote, VoteChips } from "@/components/ItemVote";
import { ChevronRightIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import type { SkinType } from "@/data/beauty/types";
import { busiestFacet, facetLove, percentOf } from "@/lib/beauty";
import { MIN_VOTES_FOR_SUMMARY } from "@/lib/vote-rules";

import { useSkinType } from "./useSkinType";

const CHOICES = ["love", "ok", "meh"] as const;

// 피부 타입별 줄을 내 표 뒤에도 맞게: 이 기기의 답이나 피부 타입이 바뀌면(투표 직후·시트에서 타입 고른 뒤·다른 탭) 집계를 다시 받는다.
// 공용 캐시(5분)를 건너뛰려고 주소에 시각을 붙인다 — 투표한 사람에게만 일어난다
function useLiveTotals(itemId: string, initial: ItemTotals, skin: SkinType | null): ItemTotals {
  const { mine } = useItemVote("beauty", itemId, initial);
  const [live, setLive] = useState(initial);
  useEffect(() => {
    if (!mine) return;
    const controller = new AbortController();
    fetch(`/api/items/beauty/${encodeURIComponent(itemId)}?t=${Date.now()}`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<ItemTotals>) : null))
      .then((data) => {
        if (data?.totals) setLive({ totals: data.totals, byFacet: data.byFacet ?? {}, total: data.total ?? 0 });
      })
      .catch(() => {
        // 못 받으면 서버 렌더 숫자 그대로
      });
    return () => controller.abort();
  }, [itemId, mine, skin]);
  return live;
}

interface Props {
  itemId: string;
  initial: ItemTotals; // 서버 렌더 집계
  showPercent: boolean; // 표가 충분할 때만 % (lib/beauty PERCENT_MIN_VOTES)
}

// 제품 '써 봤어요?' 평가. 테스트로 정한 피부 타입이 이 기기에 있으면 표에 함께 싣고(facet), 질문 아래에
// '건성 92%가 인생템' 처럼 내 타입의 집계를 보인다. 내 타입을 모르면 표가 가장 많은 타입의 집계와 테스트 링크.
// 피부 타입별 표가 적으면 % 대신 표 수만 (2표 중 2표 = 100% 같은 과장을 막는다)
export function ProductVote({ itemId, initial, showPercent }: Props) {
  const t = useTranslations("Beauty");
  const mine = useSkinType();
  const live = useLiveTotals(itemId, initial, mine);
  const shown = mine ?? busiestFacet(live);
  const stats = shown ? facetLove(live, shown) : null;

  let note: string | undefined;
  if (shown && stats && stats.total >= MIN_VOTES_FOR_SUMMARY) {
    note = t("vote.facetPercent", {
      skin: t(`skin.short.${shown}`),
      percent: percentOf(stats.love, stats.total),
      count: stats.total,
    });
  } else if (shown && stats && stats.total > 0) {
    note = t("vote.facetCount", { skin: t(`skin.short.${shown}`), count: stats.total });
  } else if (mine) {
    note = t("vote.facetFirst", { skin: t(`skin.short.${mine}`) });
  }

  return (
    <div>
      <VoteChips
        kind="beauty"
        itemId={itemId}
        initial={initial}
        choices={CHOICES.map((key) => ({ key, label: t(`vote.${key}`) }))}
        facet={mine ?? undefined}
        question={t("vote.question")}
        note={note}
        showPercent={showPercent}
      />
      {!mine && (
        <Link
          href="/beauty/skin-type"
          className="press mt-1 inline-flex min-h-11 items-center gap-0.5 rounded-btn-m px-1 text-t7 font-semibold text-brand-ink"
        >
          {t("vote.facetTest")}
          <ChevronRightIcon className="size-4" />
        </Link>
      )}
    </div>
  );
}
