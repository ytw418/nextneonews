"use client";

import { LOCALES } from "@kmedia/core";
import { useLocale } from "next-intl";
import { useState } from "react";

import { GlobeIcon } from "@/components/icons";
import { Link, usePathname } from "@/i18n/navigation";

const LABEL: Record<(typeof LOCALES)[number], string> = {
  en: "English",
  ja: "日本語",
  "zh-TW": "繁體中文",
  "zh-CN": "简体中文",
  ko: "한국어",
};

// 하단 탭바의 언어 버튼 → iOS 액션 시트처럼 아래에서 올라온다. 지금 보는 페이지 그대로 언어만 바꾼다
export function LanguageSheet({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = useLocale();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 text-muted">
        <GlobeIcon />
        <span className="text-[10.5px] font-semibold">{label}</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
          <button
            type="button"
            aria-label="close"
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+8px)] overflow-hidden rounded-[22px] bg-card shadow-2xl">
            {LOCALES.map((l) => (
              <Link
                key={l}
                href={pathname}
                locale={l}
                onClick={() => setOpen(false)}
                className="flex h-14 items-center justify-between border-b border-line px-5 text-[17px] last:border-0"
              >
                {LABEL[l]}
                {l === current && <span className="size-2 rounded-full bg-cherry" />}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
