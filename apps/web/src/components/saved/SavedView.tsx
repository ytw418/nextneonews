"use client";

import { localeHomePath } from "@kmedia/core";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";

import { EmptyMemo } from "@/components/EmptyMemo";
import { PlusSquareIcon, ShareIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import {
  addSavedMany,
  encodeSavedShare,
  readSaved,
  removeSaved,
  SAVED_KINDS,
  SAVED_SHARE_MAX,
  type SavedItem,
  type SavedKind,
  useSaved,
} from "@/lib/saved";
import { track } from "@/lib/track";

import { ImportBanner } from "./ImportBanner";
import { SavedRow } from "./SavedRow";
import { savedKey, useSummaries } from "./summaries";

const noSubscribe = () => () => {};

// 이 기기 시계로 이번 달 ("2026-9" 처럼 월은 0부터). 문자열이라 같은 달 안에서는 다시 그리지 않는다
const monthOf = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}`;
};
const thisMonth = () => monthOf(Date.now());

// 홈 화면 앱으로 열었는지 (그때는 설치 안내를 뺀다)
const standalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

type Filter = SavedKind | "all";

// 저장함 (/saved). 목록은 이 기기 localStorage 에만 있어서 전부 클라이언트에서 그린다.
// 서버 HTML·첫 하이드레이션에는 제목만 두고(빈 상태가 번쩍이지 않게) 기기 목록을 읽은 뒤 그린다
export function SavedView() {
  const t = useTranslations("Engage");
  const locale = useLocale();
  const items = useSaved();
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const month = useSyncExternalStore(noSubscribe, thisMonth, () => "");
  const installed = useSyncExternalStore(noSubscribe, standalone, () => true);
  const summaries = useSummaries(items, locale);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    track("saved_view", { count: readSaved().length });
  }, []);

  // 칩은 저장한 종류만. 고른 종류를 다 지우면 '전체'로 돌아간다
  const kinds = SAVED_KINDS.filter((k) => items.some((i) => i.kind === k));
  const active: Filter = filter !== "all" && kinds.includes(filter) ? filter : "all";
  const shown = active === "all" ? items : items.filter((i) => i.kind === active);
  const monthCount = month ? items.filter((i) => monthOf(i.at) === month).length : 0;

  const remove = (item: SavedItem) => {
    removeSaved(item.kind, item.id);
    track("unsave", { kind: item.kind, id: item.id, from: "saved" });
    toast(t("savedRemoved"), { actionLabel: t("savedUndo"), onAction: () => addSavedMany([item]) });
  };

  // 지금 보이는 목록(최신 100개)을 ?i= 링크로. 아이폰은 공유 시트, 안 되면 복사
  const share = async () => {
    const url = `${window.location.origin}${localeHomePath(locale)}/saved?i=${encodeSavedShare(shown)}`;
    track("saved_share", { count: Math.min(shown.length, SAVED_SHARE_MAX), kind: active });
    if (navigator.share) {
      try {
        await navigator.share({ title: t("savedTitle"), url });
      } catch {
        // 공유 시트를 닫은 경우
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast(t("copied"));
    } catch {
      // 클립보드 권한이 없으면 조용히 둔다
    }
  };

  const chip = (on: boolean) =>
    `press hit relative inline-flex min-h-[38px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-t6 ${
      on ? "bg-brand font-bold text-white" : "bg-card font-semibold text-ink-700 ring-1 ring-line ring-inset"
    }`;

  return (
    <>
      <div className="px-gutter pt-6">
        <h1 className="text-st2 font-bold text-ink-900">
          {t("savedTitle")}
          {hydrated && items.length > 0 && (
            <span className="ml-2 text-t5 font-semibold tabular-nums text-ink-600">{t("savedCount", { count: items.length })}</span>
          )}
        </h1>
        {hydrated && monthCount > 0 && <p className="mt-1 text-t6 text-ink-600">{t("savedMonth", { count: monthCount })}</p>}
      </div>

      {hydrated && <ImportBanner items={items} />}

      {hydrated && items.length === 0 && (
        <EmptyMemo text={t("savedEmpty")} tint="var(--tint-love)">
          <Button href="/guide" size="m" variant="neutral">
            {t("savedBrowse")}
          </Button>
        </EmptyMemo>
      )}

      {hydrated && items.length > 0 && (
        <>
          <div role="group" aria-label={t("savedFilter")} className="rail mt-4 gap-2 px-gutter py-2">
            {(["all", ...kinds] as const).map((k) => (
              <button key={k} type="button" aria-pressed={active === k} onClick={() => setFilter(k)} className={chip(active === k)}>
                {t(`savedTabs.${k}`)}
                <span className="tabular-nums">{k === "all" ? items.length : items.filter((i) => i.kind === k).length}</span>
              </button>
            ))}
          </div>

          <ul className="mt-2">
            {shown.map((item) => (
              <SavedRow key={savedKey(item)} item={item} summary={summaries[savedKey(item)]} onRemove={remove} />
            ))}
          </ul>

          <div className="px-gutter pt-4">
            <Button size="m" variant="neutral" onClick={() => void share()}>
              <ShareIcon className="size-4" />
              {t("savedShare")}
            </Button>
          </div>
        </>
      )}

      {hydrated && !installed && (
        <p className="mx-gutter mt-6 flex items-start gap-2 text-t7 text-ink-600">
          <PlusSquareIcon className="size-5 shrink-0" />
          {t("savedInstall")}
        </p>
      )}
    </>
  );
}
