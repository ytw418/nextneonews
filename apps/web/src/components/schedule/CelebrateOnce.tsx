"use client";

import { type ReactNode, useEffect, useRef } from "react";

import { sessionGet, sessionSet } from "@/lib/storage";

const COLORS = ["var(--cherry)", "var(--brand)", "var(--tint-event-awards)", "#ffffff"];

// 컴백 당일(D-0) 한 번만 터지는 작은 폭죽. 일정마다 이번 방문에 한 번 (홈 티켓과 상세가 같은 키를 쓴다).
// 동작 줄이기 설정이면 그리지 않는다. 점은 DOM 에 바로 붙였다가 0.8초 뒤 뗀다 (다시 그리지 않게)
export function CelebrateOnce({ id, children }: { id: string; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = ref.current;
    const key = `hb:celebrate:${id}`;
    if (!host || sessionGet(key) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    sessionSet(key, "1");
    const dots = Array.from({ length: 12 }, (_, i) => {
      const dot = document.createElement("span");
      const angle = (i * Math.PI) / 6; // 30도 간격
      const radius = 36 + (i % 3) * 10; // 36~56px
      dot.setAttribute("aria-hidden", "true");
      dot.className = "pointer-events-none absolute top-1/2 left-1 -mt-[3px] size-1.5 animate-burst rounded-full";
      dot.style.setProperty("--dx", `${Math.round(Math.cos(angle) * radius)}px`);
      dot.style.setProperty("--dy", `${Math.round(Math.sin(angle) * radius)}px`);
      dot.style.backgroundColor = COLORS[i % COLORS.length] ?? "";
      host.append(dot);
      return dot;
    });
    let done = false;
    const timer = window.setTimeout(() => {
      done = true;
      dots.forEach((dot) => dot.remove());
    }, 800);
    return () => {
      window.clearTimeout(timer);
      dots.forEach((dot) => dot.remove());
      // 다 터지기 전에 사라졌으면(개발 모드 이중 실행 등) 다음에 다시 터지게 키를 지운다
      if (!done) sessionSet(key, "");
    };
  }, [id]);

  return (
    <span ref={ref} className="relative">
      {children}
    </span>
  );
}
