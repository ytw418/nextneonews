"use client";

import { useLocale, useTranslations } from "next-intl";
import { type KeyboardEvent, useId, useRef, useState, useSyncExternalStore } from "react";

import { StarFilledIcon, StarIcon } from "@/components/icons";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import type { ItemTotals, VoteKind } from "@/lib/item-votes";
import { storageGet, storageSet } from "@/lib/storage";
import { track } from "@/lib/track";

export type { ItemTotals, VoteKind } from "@/lib/item-votes";

// 로그인 없는 항목 평가 (뷰티 '써 봤어요?'·시술 관심 투표·드라마 별점). 서버(lib/item-votes.ts)가 한 기기 한 표를 지키고,
// 이 기기는 고른 답을 hb:vote:{kind}:{id} 에 기억한다. 표 수는 실제 집계만 보이고(0표는 0), 답은 언제든 바꿀 수 있다

// 같은 항목의 다른 평가 UI(예: 상단 요약과 본문 칩)·피부 타입도 함께 바뀌게 알리는 이벤트
const CHANGED = "hb:vote-changed";
const STARS = [1, 2, 3, 4, 5] as const;
// 별점 평균은 표가 이만큼 모인 뒤에만 보인다 (1~2표 평균 5.0 은 과장이다). 그 전에는 '평가 n개'
const STAR_AVERAGE_MIN = 5;
// 내 피부 타입 집계 줄('건성 92%가 인생템')은 그 타입 표가 이만큼 모인 뒤에만
const FACET_MIN = 5;

// 피부 타입 테스트 결과와 같은 키 (뷰티 퀴즈가 쓴다). 값은 따옴표 없는 타입 이름: dry
const SKIN_TYPE_KEY = "hb:skin-type";
// 답을 나눠 볼 기준. lib/item-votes.ts 의 FACETS 와 같은 값 (그 파일은 서버 전용이라 값을 가져올 수 없다)
const FACET_OPTIONS: Partial<Record<VoteKind, readonly string[]>> = {
  beauty: ["dry", "oily", "combination", "sensitive", "normal"],
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

// 저장된 피부 타입 (JSON 문자열로 저장돼 있어도 읽는다). 모르는 값이면 null
function readSkinType(options: readonly string[] | undefined): string | null {
  if (!options) return null;
  const raw = storageGet(SKIN_TYPE_KEY)?.replace(/^"|"$/g, "") ?? null;
  return raw && options.includes(raw) ? raw : null;
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
        setTotals(readTotals(data));
        setVoted(choice);
        storageSet(keyOf(kind, itemId), choice);
        window.dispatchEvent(new Event(CHANGED));
        if (data?.counted) track("item_vote", { kind, id: itemId, choice, ...(facet ? { facet } : {}) });
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
  note?: string; // 질문 아래 작은 한 줄 (예: 시술 '효과 평가가 아닌 관심 집계')
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
  const storedFacet = useSyncExternalStore(
    subscribe,
    () => readSkinType(facetOptions),
    () => null,
  );
  const myFacet = facet ?? storedFacet ?? undefined;
  const [asking, setAsking] = useState<string | null>(null); // 피부 타입을 묻는 중인 답

  const choose = async (choice: string) => {
    const ok = await vote(choice, myFacet);
    if (ok && facetOptions && !myFacet && claimFacetAsk()) setAsking(choice);
  };

  const pickFacet = (value: string) => {
    const choice = asking;
    setAsking(null);
    storageSet(SKIN_TYPE_KEY, value);
    window.dispatchEvent(new Event(CHANGED));
    // 같은 답을 피부 타입과 함께 다시 낸다 (서버는 덮어쓴다)
    if (choice) void vote(choice, value);
  };

  // 내 피부 타입에서 가장 많이 고른 답 ('건성 92%가 인생템')
  const facetTotals = myFacet ? totals.byFacet[myFacet] : undefined;
  const facetCount = facetTotals ? Object.values(facetTotals).reduce((a, b) => a + b, 0) : 0;
  const facetTop = facetTotals
    ? [...choices].sort((a, b) => (facetTotals[b.key] ?? 0) - (facetTotals[a.key] ?? 0))[0]
    : undefined;
  const facetLine =
    myFacet && facetTop && facetCount >= FACET_MIN
      ? t("facetSummary", {
          facet: t(`skinTypes.${myFacet}`),
          percent: percent(facetTotals?.[facetTop.key] ?? 0, facetCount),
          choice: facetTop.label,
        })
      : null;

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
            {facetLine && `${facetLine} · `}
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

// 별 1~5 평균 (표가 없으면 0)
function average({ totals, total }: ItemTotals): number {
  if (total === 0) return 0;
  return STARS.reduce((sum, star) => sum + star * (totals[String(star)] ?? 0), 0) / total;
}

// 드라마 별점 (DESIGN.md ⑥): 큰 평균(5표 이상일 때만, 그 전에는 '평가 n개') 아래 체리 별 5개(44px).
// 별은 radiogroup — 화살표로 옮기고 Space·Enter·탭으로 고른다 (옮기기만으로는 표를 내지 않는다: 지나가는 별마다 표가 나가지 않게).
// 고르면 그 점수로 내고(바꾸면 덮어쓴다) 아래에 '내 별점 n'
export function StarVote({ kind, itemId, initial, label }: { kind: "drama"; itemId: string; initial: ItemTotals; label: string }) {
  const t = useTranslations("Engage");
  const locale = useLocale();
  const { mine, totals, busy, error, vote } = useItemVote(kind, itemId, initial);
  const headingId = useId();
  const stars = useRef<(HTMLButtonElement | null)[]>([]);
  const picked = Number(mine) || 0;
  const avg = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(average(totals));
  const count = new Intl.NumberFormat(locale).format(totals.total);
  // 탭으로 들어오면 고른 별(없으면 첫 별)에 선다
  const tabStop = picked || 1;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const at = stars.current.findIndex((el) => el === document.activeElement);
    if (at < 0) return;
    const next =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? Math.min(at + 1, STARS.length - 1)
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? Math.max(at - 1, 0)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? STARS.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    stars.current[next]?.focus();
  };

  return (
    <section aria-labelledby={headingId} className="rounded-card bg-card p-5 shadow-card">
      <h2 id={headingId} className="title text-t5 font-bold text-ink-900">
        {label}
      </h2>
      {/* 큰 평균 줄 → 아래 별 줄. 나란히 두면 390px 카드에서 '4.4 (312)' 와 별 5개가 한 줄에 안 들어가 들쭉날쭉 접혔다 */}
      <div className="mt-2 flex flex-col items-start gap-1">
        <p aria-live="polite" className="flex min-h-11 items-end gap-1.5">
          {totals.total >= STAR_AVERAGE_MIN ? (
            <>
              <span aria-hidden className="text-display font-bold tabular-nums text-ink-900">
                {avg}
              </span>
              <span aria-hidden className="text-t7 tabular-nums text-ink-600">
                ({count})
              </span>
              <span className="sr-only">{t("starAverage", { average: avg, count: totals.total })}</span>
            </>
          ) : (
            <span className="text-t6 font-semibold text-ink-700">
              {totals.total === 0 ? t("voteFirst") : t("starFew", { count: totals.total })}
            </span>
          )}
        </p>
        <div
          role="radiogroup"
          aria-labelledby={headingId}
          aria-busy={busy || undefined}
          onKeyDown={onKeyDown}
          className="-ml-1.5 flex"
        >
          {STARS.map((star, i) => (
            <button
              key={star}
              ref={(el) => {
                stars.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={picked === star}
              aria-label={t("starLabel", { count: star })}
              tabIndex={star === tabStop ? 0 : -1}
              onClick={() => void vote(String(star))}
              className={`press grid size-11 place-items-center rounded-full ${star <= picked ? "text-brand" : "text-ink-400"}`}
            >
              {star <= picked ? <StarFilledIcon className="size-7" /> : <StarIcon className="size-7" />}
            </button>
          ))}
        </div>
      </div>
      {picked > 0 && (
        <p className="mt-2 text-t7 tabular-nums text-ink-600">
          {t("starMine", { count: picked })}
          {!busy && !error ? ` · ${t("voteThanks")}` : null}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-t6 font-medium text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
