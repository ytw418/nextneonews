"use client";

import { useTranslations } from "next-intl";
import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { useModal } from "@/components/ui/useModal";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  titleId?: string;
  ariaLabel?: string; // 제목이 없을 때
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

const CLOSE_MS = 200; // sheet-out 길이
const DRAG_CLOSE_PX = 50;

// 아래에서 올라오는 시트. 위쪽은 상단 안전 영역에서 48px 이상 띄운다
// (예전 70dvh 상한은 사파리에서 460~525px 라 마지막 언어 두 줄이 가려졌다)
export function BottomSheet({
  open,
  onClose,
  title,
  titleId,
  ariaLabel,
  children,
  initialFocusRef,
  returnFocusRef,
}: Props) {
  const t = useTranslations("Nav");
  const autoId = useId();
  const labelId = title ? (titleId ?? autoId) : undefined;
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);

  // 닫힐 때 sheet-out 을 다 보여 준 뒤에 내린다
  const [rendered, setRendered] = useState(open);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setRendered(true);
  }
  useEffect(() => {
    if (open || !rendered) return;
    const id = setTimeout(() => setRendered(false), CLOSE_MS);
    return () => clearTimeout(id);
  }, [open, rendered]);

  useModal({ open, panelRef, onClose, initialFocusRef, returnFocusRef });

  // 더 내릴 내용이 있을 때만 아래 24px 를 흐리게
  const [fade, setFade] = useState(false);
  useEffect(() => {
    const body = bodyRef.current;
    if (!rendered || !body) return;
    const measure = () => setFade(body.scrollTop + body.clientHeight < body.scrollHeight - 1);
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    body.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      body.removeEventListener("scroll", measure);
    };
  }, [rendered]);

  // 손잡이·제목을 50px 넘게 끌어내리면 닫힌다
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = { y: event.clientY, dy: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!drag.current || !panel) return;
    drag.current.dy = Math.max(0, event.clientY - drag.current.y);
    panel.style.translate = `0 ${drag.current.dy}px`;
  };
  const onPointerUp = () => {
    const dy = drag.current?.dy ?? 0;
    drag.current = null;
    if (dy > DRAG_CLOSE_PX) {
      onClose();
    } else if (panelRef.current) {
      panelRef.current.style.translate = "";
    }
  };

  if (!rendered || typeof document === "undefined") return null;
  const closing = !open;

  return createPortal(
    <div className={`fixed inset-0 z-50 ${closing ? "pointer-events-none" : ""}`}>
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("close")}
        onClick={onClose}
        className={`absolute inset-0 bg-dim ${closing ? "animate-fade-out" : "animate-fade-in"}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        aria-label={labelId ? undefined : ariaLabel}
        tabIndex={-1}
        className={`fixed inset-x-2.5 bottom-[calc(env(safe-area-inset-bottom)+10px)] mx-auto flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-58px)] max-w-[420px] flex-col rounded-sheet bg-floating shadow-sheet outline-none ${
          closing ? "animate-sheet-out" : "animate-sheet-in"
        }`}
      >
        <div
          className="shrink-0 cursor-grab touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div aria-hidden className="grid h-4 place-items-center">
            <span className="h-1 w-12 rounded-full bg-line-strong" />
          </div>
          {title && (
            <h2 id={labelId} className="px-6 pt-1 pb-3 text-t4 font-bold text-ink-900">
              {title}
            </h2>
          )}
        </div>
        <div
          ref={bodyRef}
          className={`overflow-y-auto overscroll-contain pb-2 ${
            fade ? "[mask-image:linear-gradient(to_bottom,#000_calc(100%-24px),transparent)]" : ""
          }`}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
