"use client";

import { useState } from "react";

import { ShareIcon } from "@/components/icons";

// 아이폰에서는 시스템 공유 시트(인스타·Threads·LINE 등)를 띄우고, 안 되면 링크를 복사한다
export function ShareButton({ title, label, copiedLabel }: { title: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // 사용자가 공유 시트를 닫은 경우
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={label}
      className="flex h-9 items-center gap-1.5 rounded-full bg-fg px-3.5 text-[13px] font-semibold text-bg active:scale-95 transition-transform"
    >
      <span className="[&_svg]:size-[18px]">
        <ShareIcon />
      </span>
      {copied ? copiedLabel : label}
    </button>
  );
}
