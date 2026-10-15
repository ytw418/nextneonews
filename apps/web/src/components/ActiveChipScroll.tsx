"use client";

import { useEffect } from "react";

// 카테고리 칩 레일에서 선택된 칩이 화면 밖(오른쪽)에 있으면 가운데로 옮긴다. 그리는 것은 없다.
// /c/housing 으로 바로 들어와도 자기 칩이 보인다. 페이지 세로 위치는 건드리지 않게 레일만 가로로 민다
export function ActiveChipScroll({ active }: { active: string }) {
  useEffect(() => {
    const chip = document.querySelector<HTMLElement>("[data-chip-rail] [data-chip][aria-current=page]");
    const rail = chip?.closest<HTMLElement>("[data-chip-rail]");
    if (!chip || !rail) return;
    const box = rail.getBoundingClientRect();
    const own = chip.getBoundingClientRect();
    if (own.left >= box.left && own.right <= box.right) return;
    rail.scrollTo({
      left: rail.scrollLeft + own.left + own.width / 2 - (box.left + box.width / 2),
      behavior: "instant",
    });
  }, [active]);

  return null;
}
