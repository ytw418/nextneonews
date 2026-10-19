"use client";

import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";

import type { ItemTotals, VoteKind } from "@/lib/item-votes";

// 가이드 상세·허브는 DB 를 읽지 않는 정적 페이지라(revalidate=false) 서버 HTML 에 평가 집계가 없다.
// 브라우저가 /api/items/{kind}/{id}(공용 캐시 5분)로 받아 채운다. 못 받은 항목은 Map 에 없고, 화면은 빈 집계로 둔다

// 표가 하나도 없는 집계 (서버 쪽 emptyTotals 는 DB 모듈에 있어 브라우저 번들에 싣지 않는다)
export const NO_TOTALS: ItemTotals = { totals: {}, byFacet: {}, total: 0 };

// 목록이 화면 아래 이만큼 가까이 오면 집계를 받는다 (첫 화면 밖 카드 24장 때문에 들어오자마자 요청하지 않게)
const NEAR_MARGIN = "600px";

async function fetchOne(kind: VoteKind, id: string, signal: AbortSignal): Promise<[string, ItemTotals] | null> {
  try {
    const res = await fetch(`/api/items/${kind}/${encodeURIComponent(id)}`, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<ItemTotals> | null;
    if (typeof data?.total !== "number") return null;
    return [id, { totals: data.totals ?? {}, byFacet: data.byFacet ?? {}, total: data.total }];
  } catch {
    return null;
  }
}

// ids 의 지금 집계. 받기 전(또는 enabled=false)에는 null
export function useLiveTotals(kind: VoteKind, ids: readonly string[], enabled = true): Map<string, ItemTotals> | null {
  // 배열은 렌더마다 새로 만들어지니 내용(문자열)으로 비교한다
  const idsKey = ids.join(",");
  const key = `${kind}:${idsKey}`;
  const [loaded, setLoaded] = useState<{ key: string; totals: Map<string, ItemTotals> } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const list = idsKey.split(",").filter(Boolean);
    const controller = new AbortController();
    void Promise.all(list.map((id) => fetchOne(kind, id, controller.signal))).then((pairs) => {
      if (controller.signal.aborted) return;
      setLoaded({ key, totals: new Map(pairs.filter((p): p is [string, ItemTotals] => p !== null)) });
    });
    return () => controller.abort();
  }, [kind, idsKey, key, enabled]);

  return loaded?.key === key ? loaded.totals : null;
}

const TotalsContext = createContext<Map<string, ItemTotals> | null>(null);

// 카드 목록 감싸기: 목록이 화면 가까이 오면 한 번 받아 안쪽 카드(useListTotals)에 나눠 준다
export function LiveTotals({
  kind,
  ids,
  className,
  children,
}: {
  kind: VoteKind;
  ids: readonly string[];
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setNear(true);
    }, { rootMargin: NEAR_MARGIN });
    observer.observe(el);
    return () => observer.disconnect();
  }, [near]);

  const totals = useLiveTotals(kind, ids, near);
  return (
    <div ref={ref} className={className}>
      <TotalsContext value={totals}>{children}</TotalsContext>
    </div>
  );
}

// 목록 안 한 항목의 집계. 아직 못 받았으면 null, 받았는데 없으면 빈 집계
export function useListTotals(id: string): ItemTotals | null {
  const totals = useContext(TotalsContext);
  return totals ? (totals.get(id) ?? NO_TOTALS) : null;
}
