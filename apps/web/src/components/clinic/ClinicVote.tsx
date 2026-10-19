"use client";

import type { ComponentProps } from "react";

import { NO_TOTALS, useLiveTotals } from "@/components/guide/LiveTotals";
import { VoteChips } from "@/components/ItemVote";

type Props = Omit<ComponentProps<typeof VoteChips>, "kind" | "initial">;

// 시술 관심 투표: 페이지는 DB 를 읽지 않는 정적 HTML 이라 집계는 마운트 뒤 받는다. 받으면 새 집계로 다시 그린다(key) — 칩은 그 전에도 누를 수 있다
export function ClinicVote({ itemId, ...rest }: Props) {
  const live = useLiveTotals("clinic", [itemId]);
  return (
    <VoteChips key={live ? "live" : "static"} kind="clinic" itemId={itemId} initial={live?.get(itemId) ?? NO_TOTALS} {...rest} />
  );
}
