import type { ComponentPropsWithRef, ReactNode } from "react";

type Props = Omit<ComponentPropsWithRef<"button">, "aria-label" | "children"> & {
  // 모양이 아니라 하는 일을 적는다: '뒤로', '이 글 공유하기', '언어 바꾸기 (지금: English)'
  label: string;
  // inverse: 어두운 면(토스트) 위에 놓일 때
  tone?: "ink" | "inverse";
  iconSize?: 5 | 6; // 아이콘 크기 (기본 24px)
  children: ReactNode;
};

const TONE = {
  ink: "text-ink-900 active:bg-fill-weak",
  inverse: "text-bg active:bg-white/10",
} as const;

// 24px 아이콘을 44×44 누름 영역에 담는다 (Apple HIG 최소 크기)
export function IconButton({
  label,
  tone = "ink",
  iconSize = 6,
  className = "",
  type = "button",
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`press hit grid size-11 shrink-0 place-items-center rounded-full ${TONE[tone]} ${iconSize === 5 ? "[&_svg]:size-5" : "[&_svg]:size-6"} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
