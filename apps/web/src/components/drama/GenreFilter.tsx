"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

interface Item {
  id: string;
  genres: string[];
  node: ReactNode; // 서버에서 그린 카드 (커버·별점). 이 섬은 보이고 숨기기만 한다
}

const CHIP_BASE =
  "press hit relative inline-flex min-h-[38px] items-center justify-center whitespace-nowrap rounded-full px-3.5 text-t6";
const chip = (on: boolean) =>
  `${CHIP_BASE} ${on ? "bg-brand font-bold text-white" : "bg-card font-semibold text-ink-700 ring-1 ring-line ring-inset"}`;

// 드라마 가이드 목록의 장르 칩. 서버 HTML 에는 전체(첫 상태)가 그대로 들어가 검색엔진이 24편을 다 본다
export function GenreFilter({ genres, items }: { genres: { key: string; label: string }[]; items: Item[] }) {
  const t = useTranslations("Drama.hub");
  const [genre, setGenre] = useState<string | null>(null);
  const [touched, setTouched] = useState(false); // 처음 열 때는 개수를 읽어 주지 않는다
  const shown = genre ? items.filter((item) => item.genres.includes(genre)) : items;
  const pick = (next: string | null) => {
    setGenre(next);
    setTouched(true);
  };

  return (
    <>
      <div role="group" aria-label={t("genreFilter")} className="rail gap-2 px-gutter py-2">
        <button type="button" aria-pressed={genre === null} onClick={() => pick(null)} className={chip(genre === null)}>
          {t("allGenres")}
        </button>
        {genres.map((g) => (
          <button
            key={g.key}
            type="button"
            aria-pressed={genre === g.key}
            onClick={() => pick(genre === g.key ? null : g.key)}
            className={chip(genre === g.key)}
          >
            {g.label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        {touched ? t("shown", { count: shown.length }) : ""}
      </p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-5 px-gutter pt-3">
        {shown.map((item) => (
          <li key={item.id}>{item.node}</li>
        ))}
      </ul>
    </>
  );
}
