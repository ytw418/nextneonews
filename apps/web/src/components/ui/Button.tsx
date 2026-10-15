import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";

import { Link } from "@/i18n/navigation";

export type ButtonSize = "m" | "l" | "xl";
export type ButtonVariant = "primary" | "weak" | "neutral" | "danger";

// 높이는 최솟값이라 글자가 커져 줄이 바뀌면 버튼이 늘어난다 (잘리지 않는다)
const SIZE: Record<ButtonSize, string> = {
  m: "hit min-h-[38px] rounded-btn-m px-4 text-t6",
  l: "min-h-12 rounded-btn px-4 text-t5",
  xl: "min-h-14 rounded-card px-4 text-t5",
};

// fill(primary)은 화면 영역마다 하나, 나머지는 weak·neutral
const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white",
  weak: "bg-brand-weak text-brand-ink",
  neutral: "bg-fill-weak text-ink-700",
  danger: "bg-danger text-on-danger",
};

// 비활성은 투명도가 아니라 회색 (옅은 분홍 '등록' 버튼이 눌리는 것처럼 보였다)
const DISABLED = "disabled:bg-fill-weak disabled:text-ink-400 disabled:active:scale-100";

interface Common {
  size?: ButtonSize;
  variant?: ButtonVariant;
  block?: boolean;
  className?: string;
  children: ReactNode;
}

type AsButton = Common &
  Omit<ComponentPropsWithRef<"button">, keyof Common> & {
    href?: undefined;
    loading?: boolean;
  };

type AsLink = Common & {
  // '/'로 시작하는 앱 주소는 언어가 붙는 Link, 그 밖(http·mailto·/api/…)은 그냥 <a>
  href: string;
  external?: boolean; // 새 탭으로
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  lang?: string;
  download?: boolean | string;
  locale?: string; // 다른 언어 화면으로 ('영어로 읽기')
};

export type ButtonProps = AsButton | AsLink;

function classes({ size = "l", variant = "primary", block, className = "" }: Common) {
  return `press relative inline-flex items-center justify-center gap-1.5 text-center font-semibold ${SIZE[size]} ${VARIANT[variant]} ${DISABLED} ${block ? "w-full" : ""} ${className}`;
}

function isAppPath(href: string) {
  return href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/api/");
}

export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { href, external, onClick, lang, download, locale, children } = props;
    const className = classes(props);
    if (isAppPath(href) && !external && download === undefined) {
      return (
        <Link href={href} locale={locale} onClick={onClick} lang={lang} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        onClick={onClick}
        lang={lang}
        download={download}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={className}
      >
        {children}
      </a>
    );
  }

  const { size, variant, block, className, loading, children, type = "button", onClick, ...rest } = props;
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      // 로딩 중에는 눌러도 아무 일도 하지 않는다 (폼 제출도 막는다)
      onClick={loading ? (event) => event.preventDefault() : onClick}
      className={classes({ size, variant, block, className, children })}
      {...rest}
    >
      {loading ? (
        <>
          {/* 글자는 숨기기만 해서 버튼 폭이 그대로다 */}
          <span className="invisible">{children}</span>
          <span aria-hidden className="absolute inset-0 flex items-center justify-center gap-1">
            <span className="size-1.5 animate-dot rounded-full bg-current" />
            <span className="size-1.5 animate-dot rounded-full bg-current [animation-delay:150ms]" />
            <span className="size-1.5 animate-dot rounded-full bg-current [animation-delay:300ms]" />
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
