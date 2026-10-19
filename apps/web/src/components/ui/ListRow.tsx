import type { ReactNode } from "react";

import { ChevronRightIcon, ExternalIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";

interface Props {
  href?: string;
  external?: boolean; // 사이트 밖으로 (새 탭, 바깥 화살표)
  rel?: string; // 바깥 링크의 rel. 제휴 링크는 "sponsored nofollow noopener" (기본은 noopener noreferrer)
  left?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  arrow?: boolean; // 다른 화면을 여는 줄
  titleWeight?: "bold" | "semibold" | "medium";
  // 줄 안쪽 여백과 구분선 시작점: gutter 20 · read 24 · card 16(카드 안)
  inset?: "gutter" | "read" | "card";
  ariaLabel?: string; // 링크 줄에서만
  lang?: string;
  alignTop?: boolean; // 부제가 여러 줄인 줄: 왼쪽 아이콘을 제목 줄에 맞춘다 (가운데면 네 줄 덩어리 한가운데에 떴다)
}

const INSET = {
  gutter: "[--row-inset:var(--spacing-gutter)]",
  read: "[--row-inset:var(--spacing-read)]",
  card: "[--row-inset:16px]",
} as const;

const WEIGHT = { bold: "font-bold", semibold: "font-semibold", medium: "font-medium" } as const;

// 목록 한 줄. 구분선은 내용이 시작하는 자리부터 긋는다. <ul> 안에 넣는다
export function ListRow({
  href,
  external,
  rel,
  left,
  title,
  sub,
  right,
  arrow,
  titleWeight = "bold",
  inset = "gutter",
  ariaLabel,
  lang,
  alignTop,
}: Props) {
  // 글자를 아주 키우면(AX2 이상) 제목 칸이 4rem 보다 좁아져 단어가 오른쪽 배지 위로 넘쳤다.
  // 그때는 줄을 바꿔 [왼쪽 제목] / [오른쪽] 으로 쌓는다. 기본 크기·AX1·사파리 aA 135% 에서는 한 줄 그대로다
  const inner = `flex min-h-14 flex-wrap ${alignTop ? "items-start" : "items-center"} gap-x-4 gap-y-2 py-3 px-[var(--row-inset)]`;
  const content = (
    <>
      {left && <span className="shrink-0">{left}</span>}
      <span className="min-w-[min(4rem,100%)] flex-1">
        <span className={`block text-t5 leading-row text-ink-900 ${WEIGHT[titleWeight]}`}>{title}</span>
        {sub && <span className="mt-0.5 block text-t6 text-ink-600">{sub}</span>}
      </span>
      {(right || arrow || external) && (
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {right}
          {external ? (
            <ExternalIcon className="size-4 text-ink-400" />
          ) : (
            arrow && <ChevronRightIcon className="size-5 text-ink-400" />
          )}
        </span>
      )}
    </>
  );

  return (
    <li
      lang={lang}
      className={`relative ${INSET[inset]} after:absolute after:right-0 after:bottom-0 after:left-[var(--row-inset)] after:h-px after:bg-line last:after:hidden`}
    >
      {href && external ? (
        <a
          href={href}
          target="_blank"
          rel={rel ?? "noopener noreferrer"}
          aria-label={ariaLabel}
          className={`press-row ${inner}`}
        >
          {content}
        </a>
      ) : href ? (
        <Link href={href} aria-label={ariaLabel} className={`press-row ${inner}`}>
          {content}
        </Link>
      ) : (
        <div className={inner}>{content}</div>
      )}
    </li>
  );
}
