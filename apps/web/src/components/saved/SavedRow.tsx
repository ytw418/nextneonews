"use client";

import { useTranslations } from "next-intl";

import { BookIcon, ClapperIcon, CloseIcon, PlaneIcon, SparkleIcon, SunIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/IconButton";
import { Link } from "@/i18n/navigation";
import type { SavedItem, SavedKind } from "@/lib/saved";

import type { CatalogSummary } from "./summaries";

// 종류 글리프 (가이드 타일과 같은 짝: 뷰티 반짝·여행 비행기·시술 해·드라마 슬레이트)
const GLYPH: Record<SavedKind, typeof BookIcon> = {
  article: BookIcon,
  beauty: SparkleIcon,
  place: PlaneIcon,
  clinic: SunIcon,
  drama: ClapperIcon,
};

// 사진 없는 틴트 썸네일. 요약이 없으면(불러오는 중·실패) 회색
function Thumb({ kind, tint }: { kind: SavedKind; tint?: string }) {
  const Glyph = GLYPH[kind];
  return (
    <span
      aria-hidden
      className={`grid size-12 shrink-0 place-items-center rounded-btn ${tint ? "" : "bg-fill-weak"}`}
      style={tint ? { backgroundColor: tint } : undefined}
    >
      <Glyph className={`size-6 ${tint ? "text-on-tint-sub" : "text-ink-400"}`} />
    </span>
  );
}

// 저장함 한 줄. ListRow 는 줄 전체가 링크라 그 안에 저장 해제 버튼을 둘 수 없어서 같은 모양으로 링크와 버튼을 나란히 둔다.
// summary: 객체 = 링크, null = '정보를 불러오지 못함'(지울 수는 있다), undefined = 불러오는 중
export function SavedRow({
  item,
  summary,
  onRemove,
}: {
  item: SavedItem;
  summary: CatalogSummary | null | undefined;
  onRemove: (item: SavedItem) => void;
}) {
  const t = useTranslations("Engage");
  const kindLabel = t(`savedTabs.${item.kind}`);
  const title = summary ? summary.title : summary === null ? t("savedMissing") : null;
  const inner = "flex min-h-14 min-w-0 flex-1 items-center gap-4 py-3 pl-[var(--row-inset)]";

  const content = (
    <>
      <Thumb kind={item.kind} tint={summary?.tint} />
      <span className="min-w-0 flex-1">
        {title ? (
          <span className={`block text-t5 leading-row font-bold break-words ${summary ? "text-ink-900" : "text-ink-600"}`}>
            {title}
          </span>
        ) : (
          <span aria-hidden className="block h-5 w-3/5 rounded-badge bg-fill-weak" />
        )}
        <span className="mt-0.5 block text-t6 text-ink-600">
          {summary?.sub ? `${kindLabel} · ${summary.sub}` : kindLabel}
        </span>
      </span>
    </>
  );

  return (
    <li className="relative flex items-center [--row-inset:var(--spacing-gutter)] after:absolute after:right-0 after:bottom-0 after:left-[var(--row-inset)] after:h-px after:bg-line last:after:hidden">
      {summary ? (
        <Link href={summary.href} className={`press-row ${inner}`}>
          {content}
        </Link>
      ) : (
        <div className={inner} aria-busy={summary === undefined || undefined}>
          {content}
        </div>
      )}
      <IconButton
        label={t("unsave", { title: summary?.title ?? kindLabel })}
        iconSize={5}
        onClick={() => onRemove(item)}
        className="mr-2.5"
      >
        <CloseIcon className="text-ink-400" />
      </IconButton>
    </li>
  );
}
