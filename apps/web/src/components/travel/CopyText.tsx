"use client";

import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";

// 한국어 주소 복사 (카카오T·택시 앱에 붙여 넣기). 클립보드 권한이 없으면 조용히 둔다 — 화면의 주소를 보여 주면 된다
export function CopyText({ text, label, done, className = "" }: { text: string; label: string; done: string; className?: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast(done);
    } catch {
      // 권한 없음·지원 안 함
    }
  };
  return (
    <Button size="m" variant="neutral" onClick={copy} className={className}>
      {label}
    </Button>
  );
}
