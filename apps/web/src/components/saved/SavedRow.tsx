"use client";

import { useLocale, useTranslations } from "next-intl";
import { Fragment } from "react";

import { AffiliateLink } from "@/components/affiliate/AffiliateLink";
import { CoverArt } from "@/components/guide/CoverArt";
import { coverGlyph } from "@/components/guide/glyph";
import { ItemRow } from "@/components/guide/ItemRow";
import { CloseIcon, ExternalIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/IconButton";
import type { SavedItem } from "@/lib/saved";

import type { CatalogSummary } from "./summaries";

// 제목 줄바꿈: 일본어·중국어는 서버(/api/saved)가 나눠 준 구 조각 사이에서만, 한국어는 어절(keep-all) 단위로만 바꾼다.
// 한 단어가 칸보다 길 때만 아무 데서나 끊는다. 줄바꿈 사전(budoux)은 이 화면 번들에 싣지 않는다 (가이드의 Words 는 서버용)
export function SavedTitle({ summary, locale }: { summary: Pick<CatalogSummary, "title" | "chunks" | "lang">; locale: string }) {
  if (summary.chunks) {
    return (
      <span className="[word-break:keep-all] [overflow-wrap:anywhere]">
        {summary.chunks.map((chunk, i) => (
          <Fragment key={i}>
            {i > 0 && <wbr />}
            {chunk}
          </Fragment>
        ))}
      </span>
    );
  }
  const keepAll = locale === "ko" && !summary.lang;
  return (
    <span lang={summary.lang} className={keepAll ? "[word-break:keep-all] [overflow-wrap:anywhere]" : undefined}>
      {summary.title}
    </span>
  );
}

// 저장함 한 줄: 사진 없는 정사각 타이포 커버 · 제목 · 종류 · 부제, 오른쪽에 뷰티면 구매 칩(제휴, 새 탭)과 저장 해제(×).
// 구매 칩의 제휴 고지는 목록 위 한 줄(SavedView)이 맡는다.
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
  const tAff = useTranslations("Affiliate");
  const locale = useLocale();
  const kindLabel = t(`savedTabs.${item.kind}`);
  const buy = summary?.buy;

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
          <SavedTitle summary={summary} locale={locale} />
        ) : summary === null ? (
          <span className="text-ink-600">{t("savedMissing")}</span>
        ) : (
          <span aria-hidden className="block h-5 w-3/5 rounded-badge bg-fill-weak" />
        )
      }
      sub={summary?.sub ? `${kindLabel} · ${summary.sub}` : kindLabel}
      action={
        <span className="flex items-center gap-1">
          {buy && summary && (
            <AffiliateLink
              href={buy}
              placement="saved"
              itemId={summary.id}
              className="press hit inline-flex min-h-9 items-center gap-0.5 rounded-btn-m bg-brand-weak px-3 text-t7 font-semibold text-brand-ink"
            >
              <span aria-hidden>{t("savedBuy")}</span>
              <span className="sr-only">
                {t("savedBuyLabel", { title: summary.title, partner: buy.name })} {tAff("newTab")}
              </span>
              <ExternalIcon className="size-3.5" />
            </AffiliateLink>
          )}
          <IconButton label={t("unsave", { title: summary?.title ?? kindLabel })} iconSize={5} onClick={() => onRemove(item)}>
            <CloseIcon className="text-ink-600" />
          </IconButton>
        </span>
      }
    />
  );
}
