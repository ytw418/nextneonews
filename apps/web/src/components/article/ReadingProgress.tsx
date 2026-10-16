"use client";

import { useEffect, useRef } from "react";

import { CURRENT_EVENT, type CurrentArticle } from "@/components/article/NextArticleLoader";

const SHOW_AFTER_PX = 200;

// 상단바 바로 아래 2px 읽기 진행 막대. 지금 읽는 글([data-article-block]) 기준이라 다음 글이 이어 붙으면 그 글로 다시 잰다.
// 스크롤마다 다시 그리지 않게 rAF 에서 transform 만 바꾼다 (레이아웃 이동 없음)
export function ReadingProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let target: string | null = null;
    let frame = 0;

    const update = () => {
      frame = 0;
      const bar = ref.current;
      const block = target
        ? document.querySelector(`[data-article-block="${CSS.escape(target)}"]`)
        : document.querySelector("[data-article-block]");
      if (!bar || !block) return;
      const rect = block.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      const progress = range > 0 ? Math.min(1, Math.max(0, -rect.top / range)) : 1;
      bar.style.transform = `scaleX(${progress})`;
      bar.style.opacity = window.scrollY > SHOW_AFTER_PX ? "1" : "0";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onCurrent = (event: Event) => {
      target = (event as CustomEvent<CurrentArticle>).detail.id;
      onScroll();
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener(CURRENT_EVENT, onCurrent);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener(CURRENT_EVENT, onCurrent);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+48px)] z-30 h-0.5 origin-left bg-brand opacity-0 transition-opacity duration-200"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
