"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { toggleVisited, useVisited } from "@/lib/saved";
import { track } from "@/lib/track";
import { stampProgress } from "@/lib/travel";

// 대문자·자간은 라틴 글자에만 (베트남어 성조·키릴·한중일에는 걸지 않는다 — DESIGN.md §6)
const SPACED_LOCALES = new Set(["en", "fr", "id"]);

interface Props {
  slug: string;
  areaName: string;
  areaSlugs: string[]; // 같은 동네 명소 (진행 n/4)
}

// 명소 화면 '가 봤어요' 도장. 이 기기에만 남는다(lib/saved.ts hb:visited).
// 찍으면 기울어진 도장과 동네 진행 n/4 가 왼쪽에 나타나고, 같은 버튼(aria-pressed)을 다시 누르면 지운다.
// 버튼은 한 요소로 두어 눌러도 키보드 초점이 그대로 남는다. 결과는 화면 읽기에 aria-live 로 알린다
export function StampButton({ slug, areaName, areaSlugs }: Props) {
  const t = useTranslations("Travel.place");
  const locale = useLocale();
  const visited = useVisited();
  const on = visited.includes(slug);
  const progress = stampProgress(visited, areaSlugs);
  const [justStamped, setJustStamped] = useState(false);
  const [message, setMessage] = useState("");

  const toggle = () => {
    const now = toggleVisited(slug);
    setJustStamped(now);
    if (now) {
      const after = stampProgress([slug, ...visited], areaSlugs);
      track("visited_stamp", { kind: "place", id: slug, count: after.done });
      setMessage(t("stamped", { area: areaName, done: after.done, total: after.total }));
    } else {
      setMessage(t("unstamped"));
    }
  };

  return (
    <div className="flex min-h-16 items-center gap-3">
      {on && (
        // 처음 찍을 때만 찍히는 움직임 (이미 찍어 둔 곳은 기울어진 채로). 애니메이션이 회전까지 맡는다
        <span
          aria-hidden
          className={`inline-grid size-16 shrink-0 place-items-center rounded-full border-2 border-brand-ink px-1 text-brand-ink ${justStamped ? "animate-stamp-in" : "-rotate-12"}`}
        >
          <span
            className={`text-center text-st13 font-bold leading-tight ${SPACED_LOCALES.has(locale) ? "uppercase tracking-wider" : ""}`}
          >
            {t("stampMark")}
          </span>
        </span>
      )}
      {on && (
        <p className="min-w-0 flex-1 text-t6 font-semibold tabular-nums text-ink-700">
          {t("inArea", { area: areaName, done: progress.done, total: progress.total })}
        </p>
      )}
      <Button
        size={on ? "m" : "l"}
        variant={on ? "neutral" : "weak"}
        block={!on}
        aria-pressed={on}
        onClick={toggle}
        className="shrink-0"
      >
        {on && <CheckIcon className="size-4" />}
        {t("stamp")}
      </Button>
      <p aria-live="polite" className="sr-only">
        {message}
      </p>
    </div>
  );
}
