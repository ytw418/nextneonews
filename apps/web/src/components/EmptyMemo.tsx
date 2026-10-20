import type { ReactNode } from "react";

// 글이 없을 때: 회색 문장 한 줄은 고장 난 화면처럼 보여서 메모 한 장(마스킹테이프 + 틴트)으로.
// 아래에 갈 곳(영어로 읽기·일정 등)을 둔다
export function EmptyMemo({ text, tint, children }: { text: string; tint: string; children?: ReactNode }) {
  return (
    <div className="px-gutter pt-6">
      <div
        className="relative rounded-card px-5 pt-8 pb-5 text-on-tint shadow-card"
        style={{ backgroundColor: tint }}
      >
        <p className="text-t5 font-semibold">{text}</p>
        {children && <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">{children}</div>}
      </div>
    </div>
  );
}
