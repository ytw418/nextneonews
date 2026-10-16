"use client";

import { SITE_NAME } from "@kmedia/core";
import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { AppendedArticle } from "@/components/article/AppendedArticle";
import { pingView, readSlugs } from "@/components/ViewPing";
import type { AppendedArticleData, Reactions } from "@/lib/engagement";
import { track } from "@/lib/track";

// 지금 화면의 글이 바뀌면 보내는 이벤트 (하단 바·읽기 진행 막대가 대상을 바꾼다)
export const CURRENT_EVENT = "hb:current-article";

export interface CurrentArticle {
  id: string;
  slug: string;
  title: string;
  url: string; // 언어 접두사가 붙은 경로
  commentCount: number;
  reactions: Reactions;
}

const MAX_APPENDED = 3;
// 끄는 스위치: NEXT_PUBLIC_NEXT_ARTICLE=off (빌드 때 박힌다)
const ENABLED = process.env.NEXT_PUBLIC_NEXT_ARTICLE !== "off";

const noSubscribe = () => () => {};

interface Props {
  locale: string;
  current: CurrentArticle;
  candidates: string[]; // 다음 글 slug 순서 (lib/next-article.ts pickNext)
  children?: ReactNode; // 이어 붙이기가 끝난 뒤 맨 끝에 둘 것 ('더 많은 이야기')
}

// 글 끝 센티넬. 끝에 가까워지면 다음 글을 받아 최대 3편까지 이어 붙인다.
// 각 글 제목이 화면 가운데 선을 넘으면 제목·주소를 그 글로 바꾼다 (replaceState 라 '뒤로'는 이전 페이지로 나간다)
export function NextArticleLoader({ locale, current, candidates, children }: Props) {
  const [items, setItems] = useState<AppendedArticleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  // 서버 HTML(크롤러·JS 없음)에는 끝 부분을 그대로 두고, 하이드레이션 뒤에는 이어 붙이기가 끝날 때까지 숨긴다.
  // 보이는 채로 두면 글이 그 위에 붙으면서 화면 안의 '더 많은 이야기'가 밀려 내려갔다 (레이아웃 이동)
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const finished = done || items.length >= MAX_APPENDED;
  const sentinel = useRef<HTMLDivElement>(null);
  const queue = useRef<string[] | null>(null);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // 끝에서 600px 전에 미리 받는다. 붙인 뒤에도 센티넬이 보이면(짧은 글) 관찰을 새로 걸어 바로 다음 글을 받는다.
  // 위쪽 여백도 크게 둔다: 맨 아래(푸터)까지 한 번에 가면(End 키·스크롤 막대) 센티넬이 화면을 거치지 않고 위로 지나가 아무것도 붙지 않았다
  useEffect(() => {
    if (!ENABLED || done || loading || items.length >= MAX_APPENDED) return;
    const el = sentinel.current;
    if (!el) return;

    const loadNext = async () => {
      // 이미 읽은 글(hb:read, ViewPing 이 적는다)과 지금 글은 건너뛴다
      if (queue.current === null) {
        const read = new Set(readSlugs());
        queue.current = candidates.filter((slug) => slug !== current.slug && !read.has(slug));
      }
      setLoading(true);
      try {
        while (queue.current.length > 0) {
          const slug = queue.current.shift()!;
          const res = await fetch(`/api/article/${encodeURIComponent(locale)}/${encodeURIComponent(slug)}`);
          if (!res.ok) continue;
          const data = (await res.json()) as AppendedArticleData;
          setItems((list) => [...list, data]);
          return;
        }
        setDone(true);
      } catch {
        setDone(true);
      } finally {
        setLoading(false);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        void loadNext();
      },
      { rootMargin: "2000px 0px 600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length, loading, done, locale, current.slug, candidates]);

  // 지금 읽는 글 = 제목이 화면 50% 선을 넘은 마지막 글
  useEffect(() => {
    if (!ENABLED) return;
    const originalTitle = document.title;
    // 이어 붙인 글 주소인 채로 '뒤로'로 돌아오면 이 화면은 원래 글이므로 주소를 되돌린다
    if (decodeURI(window.location.pathname) !== decodeURI(current.url)) {
      window.history.replaceState({ ...window.history.state }, "", current.url);
    }

    let active = current.id;
    const seen = new Set([current.id]);
    let frame = 0;

    const update = () => {
      frame = 0;
      const blocks = Array.from(document.querySelectorAll<HTMLElement>("[data-article-block]"));
      if (blocks.length < 2) return;
      const line = window.innerHeight / 2;
      let index = 0;
      blocks.forEach((block, i) => {
        const title = block.querySelector("[data-article-title]") ?? block;
        if (i > 0 && title.getBoundingClientRect().top < line) index = i;
      });
      // 지나간 글은 화면 밖일 때 그리기를 건너뛴다 (마지막으로 잰 높이를 그대로 써서 스크롤이 튀지 않는다)
      blocks.forEach((block, i) => {
        block.style.contentVisibility = i < index ? "auto" : "";
        block.style.containIntrinsicSize = i < index ? "auto 2000px" : "";
      });

      const block = blocks[index];
      const id = block?.dataset.articleBlock;
      if (!block || !id || id === active) return;
      active = id;

      const appended = index > 0 ? itemsRef.current.find((item) => item.id === id) : undefined;
      const info: CurrentArticle = appended
        ? {
            id,
            slug: appended.slug,
            title: appended.title,
            url: appended.url,
            commentCount: appended.commentCount,
            reactions: appended.reactions,
          }
        : current;
      // 제목을 먼저 바꿔야 GA 가 주소 변경(향상된 측정 '브라우저 기록')으로 남기는 page_view 에 새 제목이 들어간다.
      // state 를 펼쳐 넣어 Next 라우터 값과 ChromeEffects 의 hbDepth 를 지킨다. pushState 는 쓰지 않는다
      document.title = appended ? `${info.title} | ${SITE_NAME}` : originalTitle;
      window.history.replaceState({ ...window.history.state }, "", info.url);
      window.dispatchEvent(new CustomEvent(CURRENT_EVENT, { detail: info }));
      if (appended && !seen.has(id)) {
        seen.add(id);
        pingView(id, info.slug);
        track("next_article_view", { depth: index, slug: info.slug });
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [current]);

  if (!ENABLED) return children;

  return (
    <>
      {items.map((item) => (
        <AppendedArticle key={item.id} data={item} locale={locale} />
      ))}
      <div ref={sentinel} aria-hidden className="h-px" />
      <div hidden={hydrated && !finished}>{children}</div>
    </>
  );
}
