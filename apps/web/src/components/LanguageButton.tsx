"use client";

import { type Locale, LOCALE_NAME } from "@kmedia/core";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { GlobeIcon } from "@/components/icons";
import { LanguageSheet } from "@/components/LanguageSheet";
import { IconButton } from "@/components/ui/IconButton";

// 상단바 오른쪽의 지구본. 글자·언어 코드 없이 아이콘만, 이름은 '언어 바꾸기 (지금: English)'
export function LanguageButton() {
  const t = useTranslations("Nav");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <>
      <IconButton
        ref={ref}
        label={t("changeLanguage", { name: LOCALE_NAME[locale] })}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <GlobeIcon />
      </IconButton>
      <LanguageSheet open={open} onClose={() => setOpen(false)} returnFocusRef={ref} />
    </>
  );
}
