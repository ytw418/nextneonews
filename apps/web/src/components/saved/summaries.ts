import { useEffect, useRef, useState } from "react";

import type { CatalogSummary } from "@/data/types";
import type { SavedItem } from "@/lib/saved";

// 저장함 한 줄에 그릴 요약은 GET /api/saved 가 돌려주는 CatalogSummary
export type { CatalogSummary };

// 키(kind:id) → 요약. null = 서버가 모르는 항목·불러오기 실패, 키가 없으면 불러오는 중
export type Summaries = Record<string, CatalogSummary | null>;

// /api/saved 가 한 번에 받는 수
const CHUNK = 100;

export const savedKey = (item: Pick<SavedItem, "kind" | "id">) => `${item.kind}:${item.id}`;

function isSummary(value: unknown): value is CatalogSummary {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.kind === "string" &&
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.tint === "string" &&
    // 앱 안 경로만 (언어가 붙는 Link 로 연다)
    typeof v.href === "string" &&
    v.href.startsWith("/") &&
    !v.href.startsWith("//")
  );
}

async function fetchSummaries(keys: string[], locale: string): Promise<Map<string, CatalogSummary>> {
  try {
    const query = new URLSearchParams({ items: keys.join(","), locale });
    const res = await fetch(`/api/saved?${query}`);
    if (!res.ok) return new Map();
    const data = (await res.json()) as { items?: unknown };
    const list = Array.isArray(data.items) ? data.items.filter(isSummary) : [];
    return new Map(list.map((s) => [savedKey(s), s]));
  } catch {
    return new Map();
  }
}

// 저장 목록의 요약을 100개씩 나눠 받는다. 이미 받은 것·받는 중인 것은 다시 묻지 않는다 (지워도 다시 부르지 않음)
export function useSummaries(items: readonly SavedItem[], locale: string): Summaries {
  const [summaries, setSummaries] = useState<Summaries>({});
  const asked = useRef(new Set<string>());

  useEffect(() => {
    const keys = items.map(savedKey).filter((key) => !asked.current.has(key));
    if (keys.length === 0) return;
    for (const key of keys) asked.current.add(key);
    for (let i = 0; i < keys.length; i += CHUNK) {
      const chunk = keys.slice(i, i + CHUNK);
      void fetchSummaries(chunk, locale).then((found) => {
        setSummaries((prev) => {
          const next = { ...prev };
          for (const key of chunk) next[key] = found.get(key) ?? null;
          return next;
        });
      });
    }
  }, [items, locale]);

  return summaries;
}
