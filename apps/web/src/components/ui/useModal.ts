"use client";

import { type RefObject, useEffect, useEffectEvent } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Options {
  open: boolean;
  panelRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

// 시트·다이얼로그 공통: 열리면 첫 초점, Esc 로 닫기, Tab 은 안에서만 돌고, 뒤 페이지는 스크롤되지 않는다.
// 닫히면 초점을 연 버튼(없으면 직전 요소)으로 돌려준다
export function useModal({ open, panelRef, onClose, initialFocusRef, returnFocusRef }: Options) {
  const close = useEffectEvent(onClose);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const returnTo = returnFocusRef?.current ?? previous;
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";

    const first = initialFocusRef?.current ?? panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
    first?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const head = items[0]!;
      const tail = items[items.length - 1]!;
      const active = document.activeElement;
      const outside = !panel.contains(active);
      if (event.shiftKey && (active === head || outside)) {
        event.preventDefault();
        tail.focus();
      } else if (!event.shiftKey && (active === tail || outside)) {
        event.preventDefault();
        head.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      html.style.overflow = overflow;
      returnTo?.focus({ preventScroll: true });
    };
  }, [open, panelRef, initialFocusRef, returnFocusRef]);
}
