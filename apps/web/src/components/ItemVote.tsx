"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useSyncExternalStore } from "react";

import { StarFilledIcon, StarIcon } from "@/components/icons";
import type { ItemTotals, VoteKind } from "@/lib/item-votes";
import { storageGet, storageSet } from "@/lib/storage";
import { track } from "@/lib/track";

export type { ItemTotals, VoteKind } from "@/lib/item-votes";

// 로그인 없는 항목 평가 (뷰티 '써 봤어요?'·시술 관심 투표·드라마 별점). 서버(lib/item-votes.ts)가 한 기기 한 표를 지키고,
// 이 기기는 고른 답을 hb:vote:{kind}:{id} 에 기억한다. 표 수는 실제 집계만 보이고(0표는 0), 답은 언제든 바꿀 수 있다

// 같은 항목의 다른 평가 UI(예: 상단 요약과 본문 칩)도 함께 바뀌게 알리는 이벤트
const CHANGED = "hb:vote-changed";
const STARS = [1, 2, 3, 4, 5] as const;

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

  async function vote(choice: string, facet?: string) {
    if (busy) return;
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
        setTotals(readTotals(data));
        setVoted(choice);
        storageSet(keyOf(kind, itemId), choice);
        window.dispatchEvent(new Event(CHANGED));
        if (data?.counted) track("item_vote", { kind, id: itemId, choice, ...(facet ? { facet } : {}) });
      } else {
        setError(t(res.status === 429 ? "voteTooFast" : "voteError"));
      }
    } catch {
      setError(t("voteError"));
    } finally {
      setPending(null);
      setBusy(false);
    }
  }

  return { mine: pending ?? voted ?? stored, totals, busy, error, vote };
}

interface ChipsProps {
  kind: VoteKind;
  itemId: string;
  initial: ItemTotals; // 서버 렌더 집계 (getItemTotals)
  choices: { key: string; label: string }[];
  facet?: string; // 뷰티: 피부 타입 (없으면 전체 집계에만 들어간다)
  question: string;
  showPercent?: boolean; // 기본은 표 수. 표가 적을 때 100% 같은 숫자가 과장돼 보여서
  note?: string; // 질문 아래 작은 한 줄 (예: 시술 '효과 평가가 아닌 관심 집계')
  className?: string;
}

// 알약 칩 2~4개 중 하나. 고른 칩만 채운(브랜드) 칩이 된다
export function VoteChips({ kind, itemId, initial, choices, facet, question, showPercent, note, className = "" }: ChipsProps) {
  const t = useTranslations("Engage");
  const locale = useLocale();
  const { mine, totals, busy, error, vote } = useItemVote(kind, itemId, initial);
  const headingId = useId();
  const number = new Intl.NumberFormat(locale);

  return (
    <section aria-labelledby={headingId} className={`rounded-card bg-card p-5 shadow-card ${className}`}>
      <h2 id={headingId} className="title text-t5 font-bold text-ink-900">
        {question}
      </h2>
      {note && <p className="mt-1 text-t7 text-ink-600">{note}</p>}
      <div role="group" aria-labelledby={headingId} aria-busy={busy || undefined} className="mt-4 flex flex-wrap gap-2">
        {choices.map((c) => {
          const on = mine === c.key;
          const n = totals.totals[c.key] ?? 0;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => void vote(c.key, facet)}
              className={`press hit inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-3.5 text-t6 ${
                on ? "bg-brand font-bold text-white" : "bg-card font-semibold text-ink-700 ring-1 ring-line ring-inset"
              }`}
            >
              {c.label}
              {totals.total > 0 && (
                <span className={`tabular-nums ${on ? "font-semibold" : "font-medium text-ink-600"}`}>
                  {showPercent ? `${percent(n, totals.total)}%` : number.format(n)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-t7 tabular-nums text-ink-600" aria-live="polite">
        {totals.total === 0 ? t("voteFirst") : t("voteTotal", { count: totals.total })}
        {mine && !busy && !error ? ` · ${t("voteThanks")}` : null}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-t6 font-medium text-danger">
          {error}
        </p>
      )}
    </section>
  );
}

// 별 1~5 평균 (표가 없으면 0)
function average({ totals, total }: ItemTotals): number {
  if (total === 0) return 0;
  return STARS.reduce((sum, star) => sum + star * (totals[String(star)] ?? 0), 0) / total;
}

// 드라마 별점. 별을 누르면 그 점수로 내고(바꾸면 덮어쓴다), 아래에 평균·평가 수
export function StarVote({ kind, itemId, initial, label }: { kind: "drama"; itemId: string; initial: ItemTotals; label: string }) {
  const t = useTranslations("Engage");
  const locale = useLocale();
  const { mine, totals, busy, error, vote } = useItemVote(kind, itemId, initial);
  const headingId = useId();
  const picked = Number(mine) || 0;
  const avg = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(average(totals));

  return (
    <section aria-labelledby={headingId} className="rounded-card bg-card p-5 shadow-card">
      <h2 id={headingId} className="title text-t5 font-bold text-ink-900">
        {label}
      </h2>
      <div role="group" aria-labelledby={headingId} aria-busy={busy || undefined} className="-ml-1.5 mt-2 flex">
        {STARS.map((star) => (
          <button
            key={star}
            type="button"
            aria-label={t("starLabel", { count: star })}
            aria-pressed={picked === star}
            onClick={() => void vote(String(star))}
            className={`press grid size-11 place-items-center rounded-full ${star <= picked ? "text-brand" : "text-ink-400"}`}
          >
            {star <= picked ? <StarFilledIcon className="size-7" /> : <StarIcon className="size-7" />}
          </button>
        ))}
      </div>
      <p className="mt-1 text-t7 tabular-nums text-ink-600" aria-live="polite">
        {totals.total === 0 ? t("voteFirst") : t("starAverage", { average: avg, count: totals.total })}
        {picked > 0 && !busy && !error ? ` · ${t("voteThanks")}` : null}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-t6 font-medium text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
