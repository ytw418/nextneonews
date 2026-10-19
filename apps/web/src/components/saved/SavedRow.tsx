"use client";

import { useTranslations } from "next-intl";

import { CoverArt } from "@/components/guide/CoverArt";
import { coverGlyph } from "@/components/guide/glyph";
import { ItemRow } from "@/components/guide/ItemRow";
import { CloseIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/IconButton";
import type { SavedItem } from "@/lib/saved";

import type { CatalogSummary } from "./summaries";

// 저장함 한 줄: 사진 없는 정사각 타이포 커버 · 제목 · 종류 · 부제, 오른쪽 저장 해제(×).
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

  return (
    <ItemRow
      href={summary?.href}
      busy={summary === undefined}
      cover={
        <CoverArt
          variant="square"
          tint={summary?.tint ?? "var(--fill-weak)"}
          glyph={summary ? coverGlyph(summary) : ""}
          className="size-14"
        />
      }
      title={
        summary ? (
          summary.title
        ) : summary === null ? (
          <span className="text-ink-600">{t("savedMissing")}</span>
        ) : (
          <span aria-hidden className="block h-5 w-3/5 rounded-badge bg-fill-weak" />
        )
      }
      sub={summary?.sub ? `${kindLabel} · ${summary.sub}` : kindLabel}
      action={
        <IconButton label={t("unsave", { title: summary?.title ?? kindLabel })} iconSize={5} onClick={() => onRemove(item)}>
          <CloseIcon className="text-ink-600" />
        </IconButton>
      }
    />
  );
}
