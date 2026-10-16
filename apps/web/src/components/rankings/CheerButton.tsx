"use client";

import { kstDay } from "@kmedia/core";
import { useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

import { CheerFilledIcon, CheerIcon } from "@/components/rankings/icons";
import { Button } from "@/components/ui/Button";
import { storageGet, storageSet } from "@/lib/storage";
import { track } from "@/lib/track";

// 같은 화면의 다른 응원 버튼(히어로·펼친 줄)도 함께 바뀌게 알리는 이벤트 (storage 이벤트는 같은 탭에는 오지 않는다)
const CHANGED = "hb:cheer";

// 오늘(KST) 이 인물을 응원했는지. 값은 그때 받은 오늘 응원 수
const keyOf = (entityId: string) => `hb:cheer:${entityId}:${kstDay()}`;

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

// 로그인 없는 응원. 하루에 인물마다 한 번 (서버가 409 로 막고, 이 기기는 localStorage 로 기억한다).
// 응원 수는 차트 점수에 섞지 않고 '오늘 팬 응원'으로 따로 보인다. 오류는 토스트가 아니라 버튼 밑에
export function CheerButton({
  entityId,
  chart,
  count: initialCount,
  block,
}: {
  entityId: string;
  chart: string;
  count: number; // 페이지를 만들 때의 오늘 응원 수 (최대 1시간 묵은 값)
  block?: boolean;
}) {
  const t = useTranslations("Rankings");
  const locale = useLocale();
  const stored = useSyncExternalStore(
    subscribe,
    () => storageGet(keyOf(entityId)),
    () => null,
  );
  const [count, setCount] = useState(initialCount);
  const [done, setDone] = useState(false); // 저장소를 못 쓰는 브라우저에서도 이번 화면에서는 응원함으로
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cheered = done || stored !== null;
  const shown = new Intl.NumberFormat(locale).format(Math.max(count, Number(stored) || 0));

  async function cheer() {
    if (cheered || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/cheer/${encodeURIComponent(entityId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      // 409 = 오늘 이미 응원함 (다른 탭·저장소를 지운 경우). 둘 다 '응원함'으로 보인다
      if (res.ok || res.status === 409) {
        const data = (await res.json().catch(() => null)) as { todayCount?: number } | null;
        const next = Math.max(count + (res.ok ? 1 : 0), data?.todayCount ?? 0);
        setCount(next);
        setDone(true);
        storageSet(keyOf(entityId), String(next));
        window.dispatchEvent(new Event(CHANGED));
        if (res.ok) track("cheer", { entity_id: entityId, chart });
      } else {
        setError(t(res.status === 429 ? "cheerTooMany" : "cheerFailed"));
      }
    } catch {
      setError(t("cheerFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${block ? "w-full" : ""}`}>
      <Button
        size="m"
        variant="weak"
        loading={busy}
        aria-pressed={cheered}
        onClick={cheer}
        className={block ? "flex-1" : ""}
      >
        {cheered ? <CheerFilledIcon className="size-4" /> : <CheerIcon className="size-4" />}
        {cheered ? t("cheered", { count: shown }) : t("cheer")}
      </Button>
      {!cheered && count > 0 && <span className="text-t7 text-ink-600">{t("cheersToday", { count: shown })}</span>}
      <p role="status" className={error ? "w-full text-st12 text-danger" : "sr-only"}>
        {error}
      </p>
    </div>
  );
}
