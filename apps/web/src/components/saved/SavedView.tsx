"use client";

import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState, useSyncExternalStore } from "react";

import { EmptyMemo } from "@/components/EmptyMemo";
import { CoverArt } from "@/components/guide/CoverArt";
import { ItemRow } from "@/components/guide/ItemRow";
import { PlusSquareIcon, ShareIcon } from "@/components/icons";
import { SaveButton } from "@/components/SaveButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { SAVED_KINDS, SECTION_TINT } from "@/data/sections";
import type { SavedKind } from "@/data/types";
import { Link } from "@/i18n/navigation";
import { isInAppBrowser } from "@/lib/install";
import { addSavedMany, readSaved, removeSaved, SAVED_SHARE_MAX, type SavedItem, useSaved } from "@/lib/saved";
import { track } from "@/lib/track";

import { ImportBanner } from "./ImportBanner";
import { PasteLink } from "./PasteLink";
import { SavedRow, SavedTitle } from "./SavedRow";
import { savedShareUrl, sendSavedList } from "./sendList";
import { type CatalogSummary, savedKey, useSummaries } from "./summaries";

const noSubscribe = () => () => {};
const DAY_MS = 86_400_000;

// 이 기기 시계로 이번 달 ("2026-9" 처럼 월은 0부터). 문자열이라 같은 달 안에서는 다시 그리지 않는다
const monthOf = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}`;
};
const thisMonth = () => monthOf(Date.now());

// 홈 화면 앱으로 열었는지 (그때는 설치 안내 대신 복원 링크 붙여넣기 칸을 둔다)
const standalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const inAppBrowser = () => isInAppBrowser(navigator.userAgent);

type Filter = SavedKind | "all";

// 종류 칩 (DESIGN.md ⑩ 칩 레일과 같은 모양). 가로 스크롤, 줄바꿈 없음
const chip = (on: boolean) =>
  `press hit inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-t6 font-semibold ${
    on ? "bg-brand text-white" : "bg-card text-ink-700 shadow-card"
  }`;

// 저장함 (/saved). 목록은 이 기기 localStorage 에만 있어서 전부 클라이언트에서 그린다.
// 서버 HTML·첫 하이드레이션에는 제목만 두고(빈 상태가 번쩍이지 않게) 기기 목록을 읽은 뒤 그린다. 화면 높이만큼 자리를 미리 잡아
// 목록·빈 상태가 들어올 때 푸터가 밀려 올라오지 않게 한다 (CLS). 빈 상태에는 에디터 추천 몇 개를 바로 저장할 수 있게 둔다.
// 저장은 이 브라우저에만 남으니 제목 옆 '나에게 보내기'로 복원 링크를 밖에 남기게 하고, 앱 안 브라우저면 그 사실을 먼저 알린다.
// 뷰티 줄의 구매 칩(제휴)이 보이면 목록 위에 PR 고지를 한 줄 둔다
export function SavedView({ picks }: { picks: CatalogSummary[] }) {
  const t = useTranslations("Engage");
  const tAff = useTranslations("Affiliate");
  const locale = useLocale();
  const items = useSaved();
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const month = useSyncExternalStore(noSubscribe, thisMonth, () => "");
  const installed = useSyncExternalStore(noSubscribe, standalone, () => true);
  const inApp = useSyncExternalStore(noSubscribe, inAppBrowser, () => false);
  const summaries = useSummaries(items, locale);
  const [filter, setFilter] = useState<Filter>("all");

  // oldestDays: 가장 오래된 저장이 며칠 됐는지 — 로그인 없이 '7일 넘은 목록으로 돌아온 비율'을 잰다 (PLAN 재방문 지표)
  useEffect(() => {
    const list = readSaved();
    const oldest = Math.min(...list.map((i) => i.at));
    track("saved_view", {
      count: list.length,
      ...(list.length > 0 ? { oldestDays: Math.max(0, Math.floor((Date.now() - oldest) / DAY_MS)) } : {}),
    });
  }, []);

  // 칩은 저장한 종류만. 고른 종류를 다 지우면 '전체'로 돌아간다
  const kinds = SAVED_KINDS.filter((k) => items.some((i) => i.kind === k));
  const active: Filter = filter !== "all" && kinds.includes(filter) ? filter : "all";
  const shown = active === "all" ? items : items.filter((i) => i.kind === active);
  const monthCount = month ? items.filter((i) => monthOf(i.at) === month).length : 0;
  const hasItems = hydrated && items.length > 0;
  const hasBuy = shown.some((i) => summaries[savedKey(i)]?.buy);

  const remove = (item: SavedItem) => {
    removeSaved(item.kind, item.id);
    track("unsave", { kind: item.kind, id: item.id, from: "saved" });
    toast(t("savedRemoved"), { actionLabel: t("savedUndo"), onAction: () => addSavedMany([item]) });
  };

  const sendToSelf = () =>
    void sendSavedList({ locale, text: t("sendToSelfText"), copied: t("sendToSelfCopied"), from: "saved" });

  // 지금 보이는 목록(최신 100개)을 ?i= 링크로 친구에게. 아이폰은 공유 시트, 안 되면 복사
  const share = async () => {
    const url = savedShareUrl(locale, shown);
    track("saved_share", { count: Math.min(shown.length, SAVED_SHARE_MAX), kind: active, from: "saved", to: "share" });
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

  const disclosureLink = (chunks: ReactNode) => (
    <Link href="/disclosure" className="font-semibold text-brand-ink underline underline-offset-4">
      {chunks}
    </Link>
  );

  return (
    <div className="min-h-svh">
      <div className="px-gutter pt-6">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h1 className="text-st2 font-bold text-ink-900">
            {t("savedTitle")}
            {/* 화면 읽기에서 제목과 개수가 붙어 읽히지 않게 실제 공백을 둔다 */}
            {hasItems && " "}
            {hasItems && (
              <span className="ml-2 text-t5 font-semibold tabular-nums text-ink-600">{t("savedCount", { count: items.length })}</span>
            )}
          </h1>
          {hasItems && (
            <Button size="m" variant="weak" onClick={sendToSelf}>
              <ShareIcon className="size-4" />
              {t("sendToSelf")}
            </Button>
          )}
        </div>
        {hydrated && monthCount > 0 && <p className="mt-1 text-t6 text-ink-600">{t("savedMonth", { count: monthCount })}</p>}
        {/* 보내기·공유 링크는 최신 100개만 담는다 (주소 길이) — 넘으면 미리 알린다 */}
        {hydrated && items.length > SAVED_SHARE_MAX && (
          <p className="mt-1 text-t7 text-ink-600">{t("savedShareCap", { count: SAVED_SHARE_MAX })}</p>
        )}
      </div>

      {hydrated && inApp && (
        <p className="mx-gutter mt-3 rounded-card bg-band px-4 py-3 text-t7 text-ink-700">{t("inAppNotice")}</p>
      )}

      {hydrated && <ImportBanner items={items} />}

      {hydrated && items.length === 0 && (
        <>
          <EmptyMemo text={t("savedEmpty")} tint={SECTION_TINT.beauty}>
            {/* weak(체리 글자)는 분홍 메모 위에서 대비가 4.5:1 에 못 미쳐 중립 버튼 */}
            <Button href="/guide" size="m" variant="neutral">
              {t("savedBrowse")}
            </Button>
          </EmptyMemo>
          {picks.length > 0 && (
            <section aria-labelledby="saved-picks" className="mt-8">
              <h2 id="saved-picks" className="px-gutter text-t5 font-bold text-ink-900">
                {t("savedPicks")}
              </h2>
              <ul className="mt-2">
                {picks.map((pick) => (
                  <ItemRow
                    key={savedKey(pick)}
                    href={pick.href}
                    cover={<CoverArt variant="square" tint={pick.tint} cover={pick.cover} className="size-14" />}
                    title={<SavedTitle summary={pick} locale={locale} />}
                    sub={pick.sub ? `${t(`savedTabs.${pick.kind}`)} · ${pick.sub}` : t(`savedTabs.${pick.kind}`)}
                    action={<SaveButton kind={pick.kind} id={pick.id} title={pick.title} />}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {hasItems && (
        <>
          <div role="group" aria-label={t("savedFilter")} className="rail mt-4 gap-2 px-gutter py-2">
            {(["all", ...kinds] as const).map((k) => (
              <button key={k} type="button" aria-pressed={active === k} onClick={() => setFilter(k)} className={chip(active === k)}>
                {t(`savedTabs.${k}`)}
                <span className="tabular-nums">{k === "all" ? items.length : items.filter((i) => i.kind === k).length}</span>
              </button>
            ))}
          </div>

          {/* 구매 칩은 제휴 링크라 고지를 먼저 (배지만 따로 두지 않는다 — DESIGN ⑨) */}
          {hasBuy && (
            <p className="mx-gutter mt-2 flex items-start gap-2 text-t7 text-ink-600">
              <Badge tone="neutral" className="shrink-0">
                {tAff("prLabel")}
              </Badge>
              <span className={`pt-0.5 ${locale === "ko" ? "[word-break:keep-all]" : ""}`}>
                {tAff.rich("disclosure", { link: disclosureLink })}
              </span>
            </p>
          )}

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
      {hydrated && installed && <PasteLink />}
    </div>
  );
}
