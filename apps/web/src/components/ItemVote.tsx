"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import { saveSkinType, useSkinType } from "@/components/beauty/useSkinType";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { SKIN_TYPES, type SkinType } from "@/data/beauty/types";
import type { ItemTotals, VoteKind } from "@/lib/item-votes";
import { storageGet, storageSet } from "@/lib/storage";
import { track } from "@/lib/track";

export type { ItemTotals, VoteKind } from "@/lib/item-votes";

// 로그인 없는 항목 평가 (뷰티 '써 봤어요?'·시술 관심 투표, 드라마 별점은 drama/DramaRating 이 useItemVote 로). 서버(lib/item-votes.ts)가 한 기기 한 표를 지키고,
// 이 기기는 고른 답을 hb:vote:{kind}:{id} 에 기억한다. 표 수는 실제 집계만 보이고(0표는 0), 답은 언제든 바꿀 수 있다

// 같은 항목의 다른 평가 UI(예: 상단 요약과 본문 칩)도 함께 바뀌게 알리는 이벤트. 피부 타입은 lib/beauty 의 키·이벤트 하나로 (useSkinType)
const CHANGED = "hb:vote-changed";

// 답을 나눠 볼 기준. 뷰티는 피부 타입 (lib/item-votes.ts 의 FACETS 와 같은 목록 — 그 파일은 서버 전용이라 SKIN_TYPES 를 쓴다)
const FACET_OPTIONS: Partial<Record<VoteKind, readonly SkinType[]>> = {
  beauty: SKIN_TYPES,
};

// 피부 타입을 묻는 시트는 한 화면 방문에 한 번만 (건너뛰면 다시 묻지 않는다). 처음 부를 때만 true
let facetAsked = false;
function claimFacetAsk(): boolean {
  if (facetAsked) return false;
  facetAsked = true;
  return true;
}

const keyOf = (kind: VoteKind, itemId: string) => `hb:vote:${kind}:${itemId}`;

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

function percent(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

function readTotals(data: Partial<ItemTotals> | null): ItemTotals {
  return { totals: data?.totals ?? {}, byFacet: data?.byFacet ?? {}, total: data?.total ?? 0 };
}

export function useItemVote(kind: VoteKind, itemId: string, initial: ItemTotals) {
  const t = useTranslations("Engage");
  const locale = useLocale();
  const stored = useSyncExternalStore(
    subscribe,
    () => storageGet(keyOf(kind, itemId)),
    () => null,
  );
  const [voted, setVoted] = useState<string | null>(null); // 저장소를 못 쓰는 브라우저에서도 이번 화면에서는 기억
  const [pending, setPending] = useState<string | null>(null); // 응답 전에 고른 답을 먼저 칠한다
  const [totals, setTotals] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const answered = useRef(false); // 이번 화면에서 투표 응답을 받았으면 true — 그보다 늦게 온 재조회가 새 숫자를 덮지 않게

  // 상세 페이지는 집계를 HTML 에 구워 최대 1시간 묵는다. 이 기기에 내 표가 있으면 마운트 뒤 한 번 다시 받아
  // '아직 평가 없음 · 내 별점 5' 같은 어긋난 화면을 막는다. 공용 캐시(5분)를 건너뛰려고 주소에 시각을 붙인다
  const hasStored = stored !== null;
  useEffect(() => {
    if (!hasStored || answered.current) return;
    const controller = new AbortController();
    fetch(`/api/items/${kind}/${encodeURIComponent(itemId)}?t=${Date.now()}`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<Partial<ItemTotals>>) : null))
      .then((data) => {
        if (data?.totals && !answered.current) setTotals(readTotals(data));
      })
      .catch(() => {
        // 못 받으면 서버 렌더 숫자 그대로
      });
    return () => controller.abort();
  }, [kind, itemId, hasStored]);

  // 표가 들어갔으면 true
  async function vote(choice: string, facet?: string): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    setPending(choice);
    setError("");
    try {
      const res = await fetch(`/api/items/${kind}/${encodeURIComponent(itemId)}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ choice, facet, locale }),
      });
      const data = (await res.json().catch(() => null)) as (Partial<ItemTotals> & { counted?: boolean }) | null;
      if (res.ok) {
        answered.current = true;
        setTotals(readTotals(data));
        setVoted(choice);
        storageSet(keyOf(kind, itemId), choice);
        window.dispatchEvent(new Event(CHANGED));
        // 시술 답('해봤어요' 등)은 건강 정보라 분석 도구로 보내지 않는다 — 이벤트와 kind·id 만 (개인정보처리방침 '익명 집계에만')
        if (data?.counted) {
          track("item_vote", { kind, id: itemId, ...(kind === "clinic" ? {} : { choice }), ...(facet ? { facet } : {}) });
        }
        return true;
      }
      setError(t(res.status === 429 ? "voteTooFast" : "voteError"));
    } catch {
      setError(t("voteError"));
    } finally {
      setPending(null);
      setBusy(false);
    }
    return false;
  }

  return { mine: pending ?? voted ?? stored, totals, busy, error, vote };
}

interface ChipsProps {
  kind: VoteKind;
  itemId: string;
  initial: ItemTotals; // 서버 렌더 집계 (getItemTotals)
  choices: { key: string; label: string }[];
  facet?: string; // 뷰티: 피부 타입. 없으면 이 기기에 저장된 타입을 쓰고, 그것도 없으면 투표 직후 한 번 묻는다
  question: string;
  showPercent?: boolean; // 기본은 표 수. 표가 적을 때 100% 같은 숫자가 과장돼 보여서
  note?: string; // 질문 아래 작은 한 줄 (예: 시술 '효과 평가가 아닌 관심 집계', 뷰티 '건성 92%가 인생템' — 피부 타입 집계 줄은 부르는 쪽 한 곳에서만)
  className?: string;
}

// 알약 칩 2~4개 중 하나 → 아래에 결과 막대 (DESIGN.md ⑤). 막대는 잉크 한 색, 내 답만 체리.
// 0표면 막대 대신 '첫 번째로 평가해 보세요'. 결과 요약 줄은 aria-live 로 읽힌다
export function VoteChips({ kind, itemId, initial, choices, facet, question, showPercent, note, className = "" }: ChipsProps) {
  const t = useTranslations("Engage");
  const locale = useLocale();
  const { mine, totals, busy, error, vote } = useItemVote(kind, itemId, initial);
  const headingId = useId();
  const number = new Intl.NumberFormat(locale);
  const facetOptions = FACET_OPTIONS[kind];
  const storedSkin = useSkinType();
  const myFacet = facet ?? (facetOptions ? storedSkin : null) ?? undefined;
  const [asking, setAsking] = useState<string | null>(null); // 피부 타입을 묻는 중인 답

  const choose = async (choice: string) => {
    const ok = await vote(choice, myFacet);
    if (ok && facetOptions && !myFacet && claimFacetAsk()) setAsking(choice);
  };

  // 같은 답을 피부 타입과 함께 다시 낸 뒤(서버는 덮어쓴다) 타입을 저장·알린다 — 같은 화면의 '내 타입 집계'·테스트 링크가
  // 바로 바뀌고, 집계를 다시 받는 쪽(ProductVote)이 새 표가 들어간 뒤에 받는다
  const pickFacet = (value: SkinType) => {
    const choice = asking;
    setAsking(null);
    if (choice) void vote(choice, value).finally(() => saveSkinType(value));
    else saveSkinType(value);
  };

  return (
    <section aria-labelledby={headingId} className={`rounded-card bg-card p-5 shadow-card ${className}`}>
      <h2 id={headingId} className="title text-t5 font-bold text-ink-900">
        {question}
      </h2>
      {note && <p className="mt-1 text-t7 text-ink-600">{note}</p>}
      <div role="group" aria-labelledby={headingId} aria-busy={busy || undefined} className="mt-4 flex flex-wrap gap-2">
        {choices.map((c) => {
          const on = mine === c.key;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => void choose(c.key)}
              className={`press hit inline-flex min-h-[38px] items-center rounded-full px-4 text-t6 font-semibold ${
                on ? "bg-brand text-white" : "bg-fill-weak text-ink-700"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {totals.total > 0 && (
        <ul aria-label={t("voteResults")} className="mt-4 flex flex-col gap-2">
          {choices.map((c) => {
            const on = mine === c.key;
            const n = totals.totals[c.key] ?? 0;
            const pct = percent(n, totals.total);
            return (
              <li key={c.key} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-2">
                <span className="text-t6 leading-row font-semibold text-ink-700 [overflow-wrap:anywhere]">
                  {c.label}
                  {on && <span className="sr-only"> ({t("pollMine")})</span>}
                </span>
                <span aria-hidden className="h-2 overflow-hidden rounded-full bg-fill-weak">
                  <span
                    className={`block h-full rounded-full transition-[width] duration-500 ease-expo ${on ? "bg-brand" : "bg-ink-900"}`}
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="text-right text-t6 font-bold tabular-nums text-ink-900">
                  {showPercent ? `${pct}%` : number.format(n)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-t7 tabular-nums text-ink-600" aria-live="polite">
        {totals.total === 0 ? (
          t("voteFirst")
        ) : (
          <>
            {t("voteTotal", { count: totals.total })}
            {mine && !busy && !error ? ` · ${t("voteThanks")}` : null}
          </>
        )}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-t6 font-medium text-danger">
          {error}
        </p>
      )}

      {facetOptions && (
        <BottomSheet open={asking !== null} onClose={() => setAsking(null)} title={t("facetAsk.title")}>
          <p className="px-6 pb-4 text-t6 text-ink-600">{t("facetAsk.body")}</p>
          <ul className="flex flex-col gap-2 px-6">
            {facetOptions.map((value) => (
              <li key={value}>
                <Button size="l" variant="neutral" block onClick={() => pickFacet(value)}>
                  {t(`skinTypes.${value}`)}
                </Button>
              </li>
            ))}
          </ul>
          <div className="px-6 pt-3 pb-4">
            <Button size="l" variant="weak" block onClick={() => setAsking(null)}>
              {t("facetAsk.skip")}
            </Button>
          </div>
        </BottomSheet>
      )}
    </section>
  );
}
