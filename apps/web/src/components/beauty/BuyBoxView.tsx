"use client";

import { type ReactNode, useEffect, useRef } from "react";

import { track } from "@/lib/track";

// 구매 상자가 화면에 처음 절반쯤 들어오면 buy_box_view 한 번 (제휴 클릭률의 분모 — affiliate_click / buy_box_view)
const VISIBLE = 0.5;

export function BuyBoxView({ placement, item, children }: { placement: string; item?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        track("buy_box_view", { placement, ...(item ? { item } : {}) });
        observer.disconnect();
      },
      { threshold: VISIBLE },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [placement, item]);

  return <div ref={ref}>{children}</div>;
}
