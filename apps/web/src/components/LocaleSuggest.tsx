"use client";

import { type Locale, matchLocale } from "@kmedia/core";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

import { usePathname } from "@/i18n/navigation";

// 그 언어 사용자에게 그 언어로 보여 준다 (지금 페이지 언어가 아니라)
const READ_IN: Record<Locale, string> = {
  en: "Read in English",
  ja: "日本語で読む",
  "zh-TW": "用繁體中文閱讀",
  "zh-CN": "用简体中文阅读",
  ko: "한국어로 보기",
  vi: "Đọc bằng tiếng Việt",
  id: "Baca dalam Bahasa Indonesia",
  fr: "Lire en français",
  ru: "Читать на русском",
};

const DISMISSED = "hb:locale-suggest-dismissed";

// 공유 링크로 다른 언어 페이지에 들어온 사람에게 브라우저 언어판을 권한다.
// 강제로 넘기지 않는다: 검색 로봇과 일부러 그 언어를 고른 사람을 막지 않기 위해서다.
// 대상 주소는 페이지에 이미 있는 hreflang 대체 링크에서 찾으므로, 번역이 있는 페이지에서만 뜬다.
function findSuggestion(current: string): { locale: Locale; href: string } | null {
  if (localStorage.getItem(DISMISSED)) return null;
  const preferred = navigator.languages.map(matchLocale).find((l) => l !== null);
  if (!preferred || preferred === current) return null;
  const link = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${preferred}"]`);
  return link ? { locale: preferred, href: link.href } : null;
}

export function LocaleSuggest() {
  const current = useLocale();
  const pathname = usePathname();
  const [suggestion, setSuggestion] = useState<{ locale: Locale; href: string } | null>(null);

  useEffect(() => {
    // 페이지를 옮기면 대체 링크도 바뀌므로 경로마다 다시 찾는다
    const found = findSuggestion(current);
    const id = requestAnimationFrame(() => setSuggestion(found));
    return () => cancelAnimationFrame(id);
  }, [current, pathname]);

  if (!suggestion) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED, "1");
    setSuggestion(null);
  };

  return (
    <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+10px)] z-40 flex justify-center px-4">
      <div className="rise flex items-center gap-1 rounded-full bg-fg py-1 pl-1 pr-1.5 text-bg shadow-xl">
        <a
          href={suggestion.href}
          lang={suggestion.locale}
          onClick={() => localStorage.setItem(DISMISSED, "1")}
          className="flex h-9 items-center gap-2 rounded-full pl-3 pr-2 text-[14px] font-semibold"
        >
          <span className="size-2 rounded-full bg-cherry" />
          {READ_IN[suggestion.locale]} →
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="close"
          className="grid size-8 place-items-center rounded-full text-[18px] leading-none opacity-60"
        >
          ×
        </button>
      </div>
    </div>
  );
}
