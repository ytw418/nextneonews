import type { ReactNode } from "react";

export type BadgeTone = "brand" | "brandWeak" | "neutral" | "paper" | "scrim" | "tint";

const TONE: Record<BadgeTone, string> = {
  brand: "bg-brand text-white",
  brandWeak: "bg-brand-weak text-brand-ink",
  neutral: "bg-fill-weak text-ink-700",
  paper: "bg-white/70 text-on-tint dark:bg-black/25", // 틴트 면 위
  scrim: "bg-black/40 text-white", // 사진 위 (흰 사진에서도 9:1 정도)
  tint: "text-on-tint", // 배경은 tint 로 받은 틴트 변수
};

interface Props {
  tone?: BadgeTone;
  tint?: string; // tone='tint' 일 때 배경, 예: "var(--tint-event-awards)"
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = "neutral", tint, className = "", children }: Props) {
  return (
    <span
      className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-badge px-2 text-t7 font-semibold tabular-nums ${TONE[tone]} ${className}`}
      style={tone === "tint" && tint ? { backgroundColor: tint } : undefined}
    >
      {children}
    </span>
  );
}
