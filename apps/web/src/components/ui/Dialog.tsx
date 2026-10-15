"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/Button";
import { useModal } from "@/components/ui/useModal";

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  body?: ReactNode;
  confirmLabel: string; // 무슨 일이 일어나는지: '삭제하기', '다시 시도'
  onConfirm: () => void;
  tone?: "primary" | "danger"; // danger 는 되돌릴 수 없는 확인 (role=alertdialog)
  loading?: boolean;
}

// 가운데 확인 창. 닫는 버튼은 항상 '닫기'(취소 아님)이고, 처음 초점도 닫기에 둔다
export function Dialog({ open, onClose, title, body, confirmLabel, onConfirm, tone = "primary", loading }: Props) {
  const t = useTranslations("Nav");
  const titleId = useId();
  const bodyId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useModal({ open, panelRef, onClose, initialFocusRef: closeRef });

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center">
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-dim animate-fade-in"
      />
      <div
        ref={panelRef}
        role={tone === "danger" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={body ? bodyId : undefined}
        className="relative max-h-[calc(100dvh-160px)] w-[calc(100vw-64px)] max-w-[320px] overflow-y-auto rounded-dialog bg-floating p-6 shadow-sheet animate-fade-in"
      >
        <h2 id={titleId} className="text-t4 font-bold text-ink-900">
          {title}
        </h2>
        {body && (
          <div id={bodyId} className="mt-2 text-t6 text-ink-700">
            {body}
          </div>
        )}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button ref={closeRef} size="l" variant="neutral" onClick={onClose}>
            {t("close")}
          </Button>
          <Button size="l" variant={tone} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
