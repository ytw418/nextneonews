"use client";

import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { CloseIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/IconButton";

export interface ToastOptions {
  href?: string; // 있으면 문구 자체가 링크
  lang?: string; // 문구 언어가 페이지와 다를 때 (언어 제안)
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void; // 사용자가 ×로 닫았을 때만 (시간이 지나 사라질 때는 부르지 않는다)
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
  message: string;
}

const EVENT = "hb:toast";
let nextId = 1;
let listening = false;
let pending: ToastItem | null = null; // Toaster 가 뜨기 전에 부른 토스트

// 한 줄 알림. 어디서든 부를 수 있다 (오류는 토스트가 아니라 그 자리에 보여 준다)
export function toast(message: string, options: ToastOptions = {}) {
  const item: ToastItem = { id: nextId++, message, ...options };
  if (!listening) {
    pending = item;
    return;
  }
  window.dispatchEvent(new CustomEvent<ToastItem>(EVENT, { detail: item }));
}

// 레이아웃에 한 번만 둔다. 한 번에 하나만 보이고, 새 토스트가 오면 바꿔 끼운다
export function Toaster() {
  const t = useTranslations("Nav");
  const [item, setItem] = useState<ToastItem | null>(null);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(0);

  const show = useEffectEvent((next: ToastItem) => {
    remaining.current = next.duration ?? (next.href || next.onAction ? 5000 : 3000);
    setPaused(false);
    setItem(next);
  });

  useEffect(() => {
    const onToast = (event: Event) => show((event as CustomEvent<ToastItem>).detail);
    window.addEventListener(EVENT, onToast);
    listening = true;
    if (pending) {
      const first = pending;
      pending = null;
      queueMicrotask(() => show(first));
    }
    return () => {
      listening = false;
      window.removeEventListener(EVENT, onToast);
    };
  }, []);

  // 초점이 토스트 안에 있는 동안은 시간이 멈춘다
  useEffect(() => {
    if (!item || paused) return;
    const started = Date.now();
    const id = setTimeout(() => setItem(null), remaining.current);
    return () => {
      clearTimeout(id);
      remaining.current = Math.max(1000, remaining.current - (Date.now() - started));
    };
  }, [item, paused]);

  const dismiss = () => {
    item?.onClose?.();
    setItem(null);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-gutter bottom-[calc(var(--bottom-ui)+12px)] z-50 mx-auto max-w-[400px]"
    >
      {item && (
        <div
          key={item.id}
          onFocus={() => setPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
          }}
          className="pointer-events-auto flex min-h-14 items-center gap-1 rounded-card bg-ink-900 pr-1 pl-4 text-t6 font-medium text-bg shadow-float animate-toast-in"
        >
          {item.href ? (
            <a
              href={item.href}
              lang={item.lang}
              onClick={() => setItem(null)}
              className="flex min-h-11 flex-1 items-center py-2 font-semibold"
            >
              {item.message}
            </a>
          ) : (
            <p lang={item.lang} className="flex-1 py-3">
              {item.message}
            </p>
          )}
          {item.actionLabel && item.onAction && (
            <button
              type="button"
              onClick={() => {
                item.onAction?.();
                setItem(null);
              }}
              className="press min-h-11 shrink-0 rounded-btn-m px-3 font-semibold text-bg active:bg-white/10"
            >
              {item.actionLabel}
            </button>
          )}
          {(item.href || item.onAction) && (
            <IconButton label={t("close")} tone="inverse" iconSize={5} onClick={dismiss}>
              <CloseIcon />
            </IconButton>
          )}
        </div>
      )}
    </div>
  );
}
