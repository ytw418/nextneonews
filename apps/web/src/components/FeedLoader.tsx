"use client";

import { lazy, type ReactNode, Suspense, useEffect, useRef, useState } from "react";

import type { FeedItem } from "@/components/FeedCard";
import { Pager } from "@/components/Pager";
import { type ColumnEnd, MAX_APPENDED, type Placed, splitColumns } from "@/lib/feed";
import { track } from "@/lib/track";

export interface Paging {
  locale: string;
  category?: string; // 카테고리 slug (없으면 전체 최신)
  page: number; // 이 화면의 쪽 번호 (홈·카테고리 첫 화면은 1)
  lastPage: number;
}

// 카드 모듈(BudouX 문장 나누기 포함)은 처음 이어 붙일 때 받는다. 첫 화면 자바스크립트를 늘리지 않게
const loadCard = () => import("@/components/FeedCard");
const FeedCard = lazy(() => loadCard().then((m) => ({ default: m.FeedCard })));

// 두 열 틀. 글자가 커져 열이 17.5rem 보다 좁아지면 한 열로 (카드의 order 로 최신순)
export function FeedGrid({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="@container px-gutter pt-3">
      <div className="grid grid-cols-2 items-start gap-3 @max-[17.5rem]:flex @max-[17.5rem]:flex-col">
        <div className="flex flex-col gap-3 @max-[17.5rem]:contents">{left}</div>
        <div className="flex flex-col gap-3 @max-[17.5rem]:contents">{right}</div>
      </div>
    </div>
  );
}

interface Props {
  left: ReactNode[]; // 서버가 그린 마지막 두 열
  right: ReactNode[];
  end: ColumnEnd; // 그 두 열의 어림 높이·카드 수 (이어 붙일 카드를 더 짧은 열부터, 순서를 이어서)
  slugs: string[]; // 서버가 그린 글 (새 글이 올라와 쪽이 밀리면 같은 글이 또 올 수 있다)
  showCategory: boolean;
  paging: Paging;
}

// 피드 끝에 닿기 전에 다음 쪽(/api/feed)을 받아 같은 두 열 끝에 이어 붙인다. 5덩어리까지, 주소는 바꾸지 않는다.
// 쪽 링크(Pager)는 언제나 남겨 둔다 — 크롤러가 가는 길이고, 받기에 실패해도 사람이 누를 수 있다
export function FeedLoader({ left, right, end, slugs, showCategory, paging }: Props) {
  const { locale, category, page, lastPage } = paging;
  const [more, setMore] = useState<{ items: FeedItem[]; chunks: number }>({ items: [], chunks: 0 });
  const [status, setStatus] = useState<"idle" | "loading" | "stopped">("idle");
  const sentinel = useRef<HTMLDivElement>(null);
  const shownTo = page + more.chunks; // 화면 끝의 쪽 번호
  const canLoad = status !== "stopped" && more.chunks < MAX_APPENDED && shownTo < lastPage;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !canLoad || status !== "idle") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        setStatus("loading");
        const next = shownTo + 1;
        const query = new URLSearchParams({ locale, page: String(next) });
        if (category) query.set("cat", category);
        Promise.all([
          loadCard(),
          fetch(`/api/feed?${query}`).then((res) => {
            if (!res.ok) throw new Error(`feed ${res.status}`);
            return res.json() as Promise<FeedItem[]>;
          }),
        ])
          .then(([, items]) => {
            setMore((prev) => {
              const seen = new Set([...slugs, ...prev.items.map((i) => i.slug)]);
              return { items: [...prev.items, ...items.filter((i) => !seen.has(i.slug))], chunks: prev.chunks + 1 };
            });
            setStatus(items.length > 0 ? "idle" : "stopped");
            track("feed_page", category ? { page: next, locale, category } : { page: next, locale });
          })
          // 실패하면 더 받지 않는다. 아래 쪽 링크로 넘어갈 수 있다
          .catch(() => setStatus("stopped"));
      },
      // 화면 끝보다 한참 먼저 받아서, 보고 있는 동안 쪽 링크가 밀려 내려가지 않게.
      // 위쪽도 넓게: 끝(End 키·스크롤 막대·맨 아래로 튕김)으로 한 번에 가면 센티넬이 화면을 거치지 않고 위로 지나가 다음 쪽이 안 붙었다
      { rootMargin: "2000px 0px 1200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [canLoad, status, shownTo, locale, category, slugs]);

  const appended = splitColumns(more.items, end);
  const cards = (placed: Placed[]) =>
    placed.length > 0 && (
      <Suspense fallback={null}>
        {placed.map(({ item, order }) => (
          <FeedCard key={item.slug} item={item} showCategory={showCategory} prefetch={false} style={{ order }} />
        ))}
      </Suspense>
    );

  return (
    <>
      {appended.end.order > 0 && (
        <FeedGrid
          left={
            <>
              {left}
              {cards(appended.left)}
            </>
          }
          right={
            <>
              {right}
              {cards(appended.right)}
            </>
          }
        />
      )}
      {canLoad && (
        // 받는 동안 점 세 개. 자리는 미리 잡아 둔다 (나타날 때 쪽 링크가 밀리지 않게)
        <div ref={sentinel} aria-hidden className="flex justify-center gap-1 pt-6 text-ink-400">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className={`size-1.5 rounded-full bg-current ${status === "loading" ? "animate-dot" : "opacity-0"}`}
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      )}
      <Pager
        category={category}
        prev={page > 1 ? page - 1 : undefined}
        next={shownTo < lastPage ? shownTo + 1 : undefined}
        more={page === 1}
      />
    </>
  );
}
