"use client";

import { Fragment, type ReactNode, useState } from "react";

interface Kind {
  key: string;
  label: string; // 칩 글자 (ロケ地·アイドルスポット…)
  shown: string; // 고른 뒤 화면 읽기에 알릴 개수 문장 ('명소 5곳')
}

interface Item {
  id: string;
  kind: string;
  node: ReactNode; // 서버에서 그린 명소 줄(PlaceRow, <li>). 이 섬은 보이고 숨기기만 한다
}

const CHIP_BASE =
  "press hit relative inline-flex min-h-[38px] items-center justify-center whitespace-nowrap rounded-full px-3.5 text-t6";
const chip = (on: boolean) =>
  `${CHIP_BASE} ${on ? "bg-brand font-bold text-white" : "bg-card font-semibold text-ink-700 ring-1 ring-line ring-inset"}`;

// 여행 허브 머리 아래 종류 칩: 첫 칩(동네별)은 동네 타일(children), 다른 칩은 동네를 가로지른 그 종류 명소 줄.
// '聖水 ロケ地' 처럼 종류로 찾아온 사람이 동네 아홉 곳을 하나씩 열어 보지 않게. 서버 HTML 에는 첫 상태(동네 타일)가 그대로 들어간다
export function KindFilter({
  label,
  allLabel,
  kinds,
  items,
  children,
}: {
  label: string; // 칩 묶음 이름 (화면 읽기)
  allLabel: string; // 첫 칩 '동네별'
  kinds: Kind[];
  items: Item[];
  children: ReactNode;
}) {
  const [kind, setKind] = useState<string | null>(null);
  const picked = kinds.find((k) => k.key === kind);
  const shown = picked ? items.filter((item) => item.kind === picked.key) : [];

  return (
    <>
      <div role="group" aria-label={label} className="rail gap-2 px-gutter pt-4 pb-1">
        <button type="button" aria-pressed={kind === null} onClick={() => setKind(null)} className={chip(kind === null)}>
          {allLabel}
        </button>
        {kinds.map((k) => (
          <button
            key={k.key}
            type="button"
            aria-pressed={kind === k.key}
            onClick={() => setKind(kind === k.key ? null : k.key)}
            className={chip(kind === k.key)}
          >
            {k.label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        {picked?.shown ?? ""}
      </p>
      {picked ? (
        <ul className="pt-2">
          {shown.map((item) => (
            <Fragment key={item.id}>{item.node}</Fragment>
          ))}
        </ul>
      ) : (
        children
      )}
    </>
  );
}
