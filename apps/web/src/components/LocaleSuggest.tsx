"use client";

import { type Locale, matchLocale } from "@kmedia/core";
import { useLocale } from "next-intl";
import { useEffect } from "react";

import { toast } from "@/components/ui/Toast";
import { usePathname } from "@/i18n/navigation";
import { sessionGet, sessionSet, storageGet, storageSet } from "@/lib/storage";

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
const SEEN = "hb:locale-suggest-seen"; // sessionStorage

// 공유 링크로 다른 언어 페이지에 들어온 사람에게 브라우저 언어판을 권한다.
// 강제로 넘기지 않는다: 검색 로봇과 일부러 그 언어를 고른 사람을 막지 않기 위해서다.
// 대상 주소는 페이지에 이미 있는 hreflang 대체 링크에서 찾으므로, 번역이 있는 페이지에서만 뜬다.
function findSuggestion(current: string): { locale: Locale; href: string } | null {
  if (storageGet(DISMISSED)) return null;
  const preferred = navigator.languages.map(matchLocale).find((l) => l !== null);
  if (!preferred || preferred === current) return null;
  const link = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${preferred}"]`);
  return link ? { locale: preferred, href: link.href } : null;
}

// 화면에 직접 그리지 않고 토스트로 띄운다. 한 방문에 한 번만(자동으로 사라지면 이번 방문만),
// ×로 닫으면 다시는 띄우지 않는다
export function LocaleSuggest() {
  const current = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    // 페이지를 옮기면 대체 링크도 바뀌므로 경로마다 다시 찾는다 (head 가 바뀐 뒤에 읽게 한 프레임 미룬다)
    const id = requestAnimationFrame(() => {
      if (sessionGet(SEEN)) return;
      const found = findSuggestion(current);
      if (!found) return;
      sessionSet(SEEN, "1");
      toast(`${READ_IN[found.locale]} →`, {
        href: found.href,
        lang: found.locale,
        duration: 5000,
        onClose: () => storageSet(DISMISSED, "1"),
      });
    });
    return () => cancelAnimationFrame(id);
  }, [current, pathname]);

  return null;
}
