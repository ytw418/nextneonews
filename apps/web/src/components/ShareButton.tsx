"use client";

import { ShareIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/IconButton";
import { toast } from "@/components/ui/Toast";

// 아이폰에서는 시스템 공유 시트(인스타·Threads·LINE 등)를 띄우고, 안 되면 링크를 복사한 뒤 토스트로 알린다
export function ShareButton({ title, label, copiedLabel }: { title: string; label: string; copiedLabel: string }) {
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
    try {
      await navigator.clipboard.writeText(url);
      toast(copiedLabel);
    } catch {
      // 클립보드 권한이 없으면 조용히 둔다
    }
  }

  return (
    <IconButton label={label} onClick={share}>
      <ShareIcon />
    </IconButton>
  );
}
