"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { type ItemTotals, useItemVote, VoteChips } from "@/components/ItemVote";
import { ChevronRightIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import type { SkinType } from "@/data/beauty/types";
import { busiestFacet, facetLove, PERCENT_MIN_VOTES, percentOf } from "@/lib/beauty";
import { MIN_VOTES_FOR_SUMMARY } from "@/lib/vote-rules";

import { useSkinType } from "./useSkinType";

const CHOICES = ["love", "ok", "meh"] as const;

function readTotals(data: Partial<ItemTotals>): ItemTotals {
  return { totals: data.totals ?? {}, byFacet: data.byFacet ?? {}, total: data.total ?? 0 };
}

// 지금 집계: 상세 HTML 은 정적이라 숫자가 하루 묵거나(빌드 직후엔 0) 하므로 마운트 뒤 /api/items 에서 받는다.
// 처음은 공용 캐시(CDN 5분)로, 이 기기의 답이나 피부 타입이 바뀌면(투표 직후·시트에서 타입 고른 뒤·다른 탭) 주소에 시각을 붙여 새로 받는다.
// seed: 이 기기에 표가 없을 때 받은 첫 집계 — 투표 칩을 이 값으로 한 번 다시 그린다 (표가 있으면 칩이 스스로 다시 받는다)
function useLiveTotals(itemId: string, initial: ItemTotals, skin: SkinType | null) {
  const { mine } = useItemVote("beauty", itemId, initial);
  const [live, setLive] = useState<ItemTotals | null>(null);
  const [seed, setSeed] = useState<ItemTotals | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const fresh = mine ? `?t=${Date.now()}` : "";
    fetch(`/api/items/beauty/${encodeURIComponent(itemId)}${fresh}`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<Partial<ItemTotals>>) : null))
      .then((data) => {
        if (!data?.totals) return;
        const totals = readTotals(data);
        setLive(totals);
        // 응답 전에 투표하면 mine 이 바뀌며 이 요청은 취소된다 — 투표 응답 숫자를 옛 숫자로 덮지 않는다
        if (!mine) setSeed((prev) => prev ?? totals);
      })
      .catch(() => {
        // 못 받으면 HTML 숫자 그대로
      });
    return () => controller.abort();
  }, [itemId, mine, skin]);
  return { live: live ?? seed ?? initial, seed };
}

interface Props {
  itemId: string;
  initial: ItemTotals; // HTML 에 구운 집계 (하루 1번 다시 그릴 때의 값, 빌드 직후엔 0)
}

// 제품 '써 봤어요?' 평가. 테스트로 정한 피부 타입이 이 기기에 있으면 표에 함께 싣고(facet), 질문 아래에
// '건성 92%가 인생템' 처럼 내 타입의 집계를 보인다. 내 타입을 모르면 표가 가장 많은 타입의 집계와 테스트 링크.
// 표가 적으면 % 대신 표 수만 (2표 중 2표 = 100% 같은 과장을 막는다)
export function ProductVote({ itemId, initial }: Props) {
  const t = useTranslations("Beauty");
  const mine = useSkinType();
  const { live, seed } = useLiveTotals(itemId, initial, mine);
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
        key={seed ? "seed" : "html"}
        kind="beauty"
        itemId={itemId}
        initial={seed ?? initial}
        choices={CHOICES.map((key) => ({ key, label: t(`vote.${key}`) }))}
        facet={mine ?? undefined}
        question={t("vote.question")}
        note={note}
        showPercent={live.total >= PERCENT_MIN_VOTES}
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
