"use client";

import { isLocale, LOCALE_NAME } from "@kmedia/core";
import { useTranslations } from "next-intl";
import { type ReactNode, useOptimistic, useState, useSyncExternalStore, useTransition } from "react";

import { ShareIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import type { PollByLocale, PollOption, PollView } from "@/lib/engagement";
import { storageGet, storageSet } from "@/lib/storage";
import { track } from "@/lib/track";

// 이보다 적으면 결과를 펼쳐 두지 않는다 (몇 표로 1위를 말하지 않게)
const RESULTS_MIN = 10;
// 409(이 기기는 이미 투표함)인데 무엇을 골랐는지 모를 때
const UNKNOWN = "?";

const noSubscribe = () => () => {};

interface State {
  totals: Record<string, number>;
  total: number;
  byLocale: PollByLocale | null;
  choice: string | null;
}

function percent(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

// 표가 가장 많은 보기 (같으면 앞 보기)
function top(options: PollOption[], counts: Record<string, number> | undefined): PollOption | null {
  let best: PollOption | null = null;
  for (const o of options) {
    if ((counts?.[o.id] ?? 0) > (best ? (counts?.[best.id] ?? 0) : 0)) best = o;
  }
  return best;
}

function Results({ options, totals, total, choice, mineLabel }: {
  options: PollOption[];
  totals: Record<string, number>;
  total: number;
  choice: string | null;
  mineLabel: string;
}) {
  return (
    <ul className="space-y-3">
      {options.map((o) => {
        const n = totals[o.id] ?? 0;
        const pct = percent(n, total);
        const mine = o.id === choice;
        return (
          <li key={o.id}>
            <div className="flex items-baseline justify-between gap-3 text-t6">
              <span className={`min-w-0 break-words ${mine ? "font-bold text-ink-900" : "font-medium text-ink-700"}`}>
                {o.label}
                {mine && <span className="ml-1.5 text-t7 font-semibold text-brand-ink">{mineLabel}</span>}
              </span>
              <span className="shrink-0 tabular-nums text-ink-600">
                <span className="font-bold text-ink-900">{pct}%</span> · {n}
              </span>
            </div>
            <div aria-hidden className="mt-1.5 h-2 overflow-hidden rounded-full bg-fill-weak">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-expo ${mine ? "bg-brand" : "bg-ink-400"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

interface Props {
  poll: PollView;
  locale: string;
  anchorId?: string; // 글 페이지는 'poll', 이어 붙인 글은 'poll-{id}'
  articleId?: string; // 하단 바 💖 가 이 투표로 내려오게 (주간 투표는 없음)
  shareUrl?: string; // 공유할 글 주소 (언어 접두사가 붙은 경로). 없으면 지금 주소
  className?: string; // 바깥 여백. 글 안은 읽기 단 여백, 홈 피드 사이 자리는 피드가 여백을 준다
  kicker?: ReactNode; // 질문 위 작은 한 줄 (홈 주간 투표: 팬 픽 차트로 가는 링크)
}

// 로그인 없는 독자 투표. 질문·보기·표 수·(10표 이상이면) 결과까지 서버 HTML 에 들어간다.
// 투표하면 막대를 바로 채우고(useOptimistic) 언어별 1위와 전체 1위를 함께 보여 준다
export function PollCard({ poll, locale, anchorId, articleId, shareUrl, className = "mx-read mt-8", kicker }: Props) {
  const t = useTranslations("Engage");
  const key = `hb:poll:${poll.id}`;
  const stored = useSyncExternalStore(noSubscribe, () => storageGet(key), () => null);
  const [state, setState] = useState<State>({ totals: poll.totals, total: poll.total, byLocale: null, choice: null });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const base = state.choice ? state : { ...state, choice: stored };
  const [view, addVote] = useOptimistic(base, (s: State, option: string) => ({
    ...s,
    choice: option,
    totals: { ...s.totals, [option]: (s.totals[option] ?? 0) + 1 },
    total: s.total + 1,
  }));

  const questionId = `${anchorId ?? `poll-${poll.id}`}-q`;

  const vote = (option: string) => {
    if (view.choice || pending) return;
    setError(null);
    startTransition(async () => {
      addVote(option);
      try {
        const res = await fetch(`/api/polls/${poll.id}/vote`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ option, locale }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok || res.status === 409) {
          const choice = res.ok ? option : UNKNOWN;
          storageSet(key, choice);
          startTransition(() => setState({ totals: data.totals ?? {}, total: data.total ?? 0, byLocale: data.byLocale ?? null, choice }));
          if (res.ok) track("poll_vote", { poll: poll.id, option });
          return;
        }
        setError(res.status === 429 ? t("pollTooFast") : res.status === 410 ? t("pollClosed") : t("pollError"));
      } catch {
        setError(t("pollError"));
      }
    });
  };

  const share = async () => {
    const url = new URL(shareUrl ?? window.location.pathname, window.location.origin);
    url.hash = anchorId ?? "";
    track("share", { from: "poll" });
    if (navigator.share) {
      try {
        await navigator.share({ title: poll.question, url: url.href });
      } catch {
        // 공유 시트를 닫은 경우
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url.href);
      toast(t("copied"));
    } catch {
      // 클립보드 권한이 없으면 조용히 둔다
    }
  };

  // 9개 언어 합산이 우리 차별점: 내 언어 독자 1위와 전체 1위를 나란히
  const mineTop = top(poll.options, view.byLocale?.[locale]);
  const allTop = top(poll.options, view.totals);

  return (
    <section
      id={anchorId}
      data-engage-for={articleId}
      aria-labelledby={questionId}
      className={`${className} scroll-mt-20 rounded-card bg-card p-5 shadow-card`}
    >
      {kicker && <p className="mb-2 text-t7 font-semibold text-brand-ink">{kicker}</p>}
      <h2 id={questionId} className="title text-t4 font-bold text-ink-900">
        {poll.question}
      </h2>

      {view.choice ? (
        <div className="mt-4" aria-live="polite">
          {mineTop && allTop && isLocale(locale) && (
            <p className="mb-3 rounded-btn-m bg-brand-weak px-3 py-2 text-t7 font-semibold text-brand-ink">
              {t("pollTopPick", { language: LOCALE_NAME[locale], mine: mineTop.label, all: allTop.label })}
            </p>
          )}
          <Results
            options={poll.options}
            totals={view.totals}
            total={view.total}
            choice={view.choice}
            mineLabel={t("pollMine")}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-t7 tabular-nums text-ink-600">{t("pollTotal", { count: view.total })}</p>
            <Button size="m" variant="neutral" onClick={() => void share()}>
              <ShareIcon className="size-4" />
              {t("pollShare")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div role="group" aria-labelledby={questionId} className="mt-4 space-y-2">
            {poll.options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => vote(o.id)}
                className="press flex min-h-12 w-full items-center rounded-btn bg-fill-weak px-4 py-2.5 text-left text-t5 font-semibold text-ink-900"
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-t7 tabular-nums text-ink-600">
            {t("pollTotal", { count: view.total })}
            {view.total === 0 ? ` · ${t("pollFirst")}` : view.total < RESULTS_MIN ? ` · ${t("pollSoon")}` : null}
          </p>
          {/* 크롤러가 결과 글자를 읽을 수 있게 접은 채로 HTML 에 둔다 */}
          {view.total >= RESULTS_MIN && (
            <details className="faq group mt-3">
              <summary className="flex min-h-11 cursor-pointer items-center text-t6 font-semibold text-ink-700">
                {t("pollResults")}
              </summary>
              <div className="pt-2">
                <Results options={poll.options} totals={view.totals} total={view.total} choice={null} mineLabel="" />
              </div>
            </details>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-t6 font-medium text-danger">
          {error}
        </p>
      )}
      <p className="mt-3 text-st12 text-ink-600">{t("pollDisclaimer")}</p>
    </section>
  );
}
