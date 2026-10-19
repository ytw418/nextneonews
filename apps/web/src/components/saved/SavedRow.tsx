"use client";

import { useLocale, useTranslations } from "next-intl";

import { CoverArt } from "@/components/guide/CoverArt";
import { coverGlyph } from "@/components/guide/glyph";
import { ItemRow } from "@/components/guide/ItemRow";
import { Words } from "@/components/guide/Words";
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
  const locale = useLocale();
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
          // 일본어·중국어는 구, 한국어는 어절 단위로만 줄을 바꾼다(가이드 화면과 같은 방식)
          <Words text={summary.title} locale={locale} />
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
