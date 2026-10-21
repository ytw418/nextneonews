import { useEffect, useRef, useState } from "react";

import type { SavedSummary } from "@/data/catalog";
import type { SavedItem } from "@/lib/saved";

// 저장함 한 줄에 그릴 요약은 GET /api/saved 가 돌려주는 SavedSummary
// (+ 상세와 같은 커버 cover(3D 아이콘·CC 사진), 일본어·중국어 제목 조각 chunks, 뷰티 구매 링크 buy)
export type CatalogSummary = SavedSummary;

function isBuy(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  // 제휴 링크는 파트너 사이트(https)로만 연다
  return typeof v.href === "string" && v.href.startsWith("https://") && typeof v.partner === "string" && typeof v.name === "string";
}

// 커버: 아이콘 키(파일 이름)는 글자·숫자·하이픈만, 사진은 위키미디어 공용 원본 주소만 (이미지 로더가 썸네일로 바꾼다),
// 제품 사진은 우리 /products/ 파일만
function isCover(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.kind === "icon") return typeof v.icon === "string" && /^[a-z0-9-]+$/.test(v.icon);
  if (v.kind === "product") {
    const p = v.photo as Record<string, unknown> | null;
    return !!p && typeof p.src === "string" && /^\/products\/[a-z0-9-]+\.webp$/.test(p.src);
  }
  if (v.kind !== "photo" || !v.photo || typeof v.photo !== "object") return false;
  const p = v.photo as Record<string, unknown>;
  return (
    typeof p.url === "string" &&
    p.url.startsWith("https://upload.wikimedia.org/") &&
    typeof p.width === "number" &&
    typeof p.licenseName === "string" &&
    typeof p.sourceUrl === "string"
  );
}

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
    isCover(v.cover) &&
    (v.lang === undefined || typeof v.lang === "string") &&
    (v.chunks === undefined || (Array.isArray(v.chunks) && v.chunks.every((c) => typeof c === "string"))) &&
    (v.buy === undefined || isBuy(v.buy)) &&
    // 앱 안 경로만 (언어가 붙는 Link 로 연다)
    typeof v.href === "string" &&
    v.href.startsWith("/") &&
    !v.href.startsWith("//")
  );
}

// 요청이 실패하면 null (그 묶음은 다음에 목록이 바뀔 때 다시 묻는다)
async function fetchSummaries(keys: string[], locale: string): Promise<Map<string, CatalogSummary> | null> {
  try {
    const query = new URLSearchParams({ items: keys.join(","), locale });
    const res = await fetch(`/api/saved?${query}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: unknown };
    const list = Array.isArray(data.items) ? data.items.filter(isSummary) : [];
    return new Map(list.map((s) => [savedKey(s), s]));
  } catch {
    return null;
  }
}

// 저장 목록의 요약을 100개씩 나눠 받는다. 이미 받은 것·받는 중인 것은 다시 묻지 않는다 (지워도 다시 부르지 않음).
// 실패한 묶음만 '물어봄'에서 빼 둬서, 항목을 지우거나 더해 목록이 바뀌면 새로고침 없이 다시 불러온다
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
        if (!found) for (const key of chunk) asked.current.delete(key);
        setSummaries((prev) => {
          const next = { ...prev };
          for (const key of chunk) next[key] = found?.get(key) ?? null;
          return next;
        });
      });
    }
  }, [items, locale]);

  return summaries;
}
