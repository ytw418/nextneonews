"use client";

import { type ReactNode, useEffect, useRef } from "react";

// 화면 아래 고정 버튼 자리 (탭바 대신). 글자가 커져 버튼이 두 줄이 되면 높이가 바뀌므로
// 잰 높이를 html 의 --bottom-ui 로 써서 본문 아래 여백·토스트 위치가 따라오게 한다.
// 배경은 버튼 뒤가 꽉 찬 bg 이고 위 32px 에서 흐려진다 (weak 버튼은 반투명이라 뒤 글자가 비쳐 보였고,
// 12px 은 너무 짧아 버튼 바로 위 줄이 글자 한가운데서 잘려 보였다).
// 버튼 글자는 24px 에서 멈춘다(chrome-cta): 글자를 키워도 두 버튼이 나란히 남아 화면 1/4 을 먹지 않는다
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
      <div className="mx-auto max-w-[640px] bg-[linear-gradient(to_top,var(--bg)_calc(100%-32px),transparent)] px-gutter pt-8 pb-[calc(12px+env(safe-area-inset-bottom))] [&_a]:text-chrome-cta [&_button]:text-chrome-cta">
        {children}
      </div>
    </div>
  );
}
