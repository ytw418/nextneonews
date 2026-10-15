"use client";

import { type ReactNode, useEffect, useRef } from "react";

// 화면 아래 고정 버튼 자리 (탭바 대신). 글자가 커져 버튼이 두 줄이 되면 높이가 바뀌므로
// 잰 높이를 html 의 --bottom-ui 로 써서 본문 아래 여백·토스트 위치가 따라오게 한다
export function FixedBottomCTA({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      root.style.setProperty("--bottom-ui", `${Math.ceil(el.getBoundingClientRect().height)}px`);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--bottom-ui");
    };
  }, []);

  return (
    <div ref={ref} data-bottom-cta className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto max-w-[640px] bg-[linear-gradient(to_top,var(--bg)_75%,transparent)] px-gutter pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}
