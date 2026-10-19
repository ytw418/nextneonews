import type { ReactNode } from "react";

import { ChevronRightIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";

interface Props {
  title: ReactNode;
  id?: string;
  count?: number;
  href?: string;
  linkLabel?: string; // '전체 보기'처럼 다음 화면을 말하는 글자
  inset?: "gutter" | "read";
}

// 모든 화면의 섹션 제목은 이 모양 하나 (t4 굵게). 작은·회색·명조 변형은 두지 않는다
export function SectionHeader({ title, id, count, href, linkLabel, inset = "gutter" }: Props) {
  return (
    <div
      className={`flex items-center justify-between gap-3 pt-6 pb-3 ${inset === "read" ? "px-read" : "px-gutter"}`}
    >
      <h2 id={id} className="min-w-0 grow text-t4 font-bold text-ink-900">
        {title}
        {/* 화면 읽기에서 제목과 개수가 붙어 읽히지 않게 실제 공백을 둔다 */}
        {count !== undefined && count > 0 && " "}
        {count !== undefined && count > 0 && <span className="ml-1.5 tabular-nums text-ink-400">{count}</span>}
      </h2>
      {href && (
        <Link
          href={href}
          className="press -my-2 -mr-2 flex min-h-11 shrink-0 items-center gap-0.5 rounded-btn-m px-2 text-t6 font-medium text-ink-600"
        >
          {linkLabel}
          <ChevronRightIcon className="size-4 text-ink-400" />
        </Link>
      )}
    </div>
  );
}
