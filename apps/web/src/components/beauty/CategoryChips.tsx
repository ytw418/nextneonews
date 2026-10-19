import { ActiveChipScroll } from "@/components/ActiveChipScroll";
import { BEAUTY_CATEGORIES, type BeautyCategory } from "@/data/beauty/types";
import { Link } from "@/i18n/navigation";

// 어워드 분류 알약 레일 (홈 카테고리 칩과 같은 모양). 지금 보는 분류가 채운 칩이고, 화면 밖이면 가운데로 옮긴다
export function CategoryChips({
  label,
  names,
  active,
}: {
  label: string;
  names: Record<BeautyCategory, string>;
  active?: BeautyCategory;
}) {
  const chip = (on: boolean) =>
    `press hit relative inline-flex min-h-[38px] items-center justify-center whitespace-nowrap rounded-full px-3.5 text-t6 ${
      on ? "bg-brand font-bold text-white" : "bg-card font-semibold text-ink-700 ring-1 ring-line ring-inset"
    }`;
  return (
    <nav data-chip-rail aria-label={label} className="rail gap-2 px-gutter py-2">
      {BEAUTY_CATEGORIES.map((c) => (
        <Link
          key={c}
          href={`/beauty/awards/${c}`}
          data-chip
          aria-current={active === c ? "page" : undefined}
          className={chip(active === c)}
        >
          {names[c]}
        </Link>
      ))}
      {active && <ActiveChipScroll active={active} />}
    </nav>
  );
}
