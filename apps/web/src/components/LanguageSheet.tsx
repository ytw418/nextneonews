"use client";

import { LOCALE_NAME, LOCALES } from "@kmedia/core";
import { useLocale } from "next-intl";
import { useRef, useState } from "react";

import { markReplace } from "@/components/ChromeEffects";
import { CheckIcon, GlobeIcon } from "@/components/icons";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Link, usePathname } from "@/i18n/navigation";

// 언어 버튼 → 아래에서 올라오는 시트. 지금 보는 페이지 그대로 언어만 바꾼다.
// replace 로 바꿔서 '뒤로'를 눌러도 이전 언어로 되돌아가지 않는다
export function LanguageSheet({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = useLocale();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const currentRef = useRef<HTMLAnchorElement>(null);
  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="press flex min-h-12 flex-col items-center justify-center gap-0.5 px-4 text-ink-600"
      >
        <GlobeIcon />
        <span className="text-chrome-tab font-semibold">{label}</span>
      </button>
      <BottomSheet open={open} onClose={close} title={label} initialFocusRef={currentRef} returnFocusRef={triggerRef}>
        <ul>
          {LOCALES.map((l) => {
            const selected = l === current;
            return (
              <li key={l}>
                <Link
                  ref={selected ? currentRef : undefined}
                  href={pathname}
                  locale={l}
                  replace
                  lang={l}
                  hrefLang={l}
                  aria-current={selected ? "true" : undefined}
                  onClick={() => {
                    markReplace();
                    close();
                  }}
                  className="press-row flex min-h-13 items-center gap-3 px-6 text-t5"
                >
                  <span className="grid size-6 shrink-0 place-items-center">
                    {selected && <CheckIcon className="text-brand-ink" />}
                  </span>
                  <span className={selected ? "font-semibold text-ink-900" : "text-ink-700"}>{LOCALE_NAME[l]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </BottomSheet>
    </>
  );
}
