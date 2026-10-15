"use client";

import { type Locale, LOCALE_NAME, LOCALES } from "@kmedia/core";
import { useLocale, useTranslations } from "next-intl";
import { type RefObject, useRef, useState } from "react";

import { markReplace } from "@/components/ChromeEffects";
import { CheckIcon } from "@/components/icons";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Link, usePathname } from "@/i18n/navigation";

// 아직 번역이 없는 글에서 그 언어 줄 아래에 붙는 안내. 그 줄의 언어로 쓴다
// (예전에는 말없이 영어판으로 되돌아갔다)
const NOT_YET: Record<Locale, string> = {
  en: "This article isn't translated yet. Opens Home",
  ja: "この記事はまだ翻訳中です。ホームを開きます",
  "zh-TW": "這篇還在翻譯中，將開啟首頁",
  "zh-CN": "这篇还在翻译中，将打开首页",
  ko: "이 글은 아직 번역 중이에요. 홈을 열어요",
  vi: "Bài này đang được dịch. Sẽ mở Trang chủ",
  id: "Artikel ini sedang diterjemahkan. Membuka Beranda",
  fr: "Cet article est en cours de traduction. L’accueil va s’ouvrir",
  ru: "Статью ещё переводим. Откроется главная",
};

// 글 페이지에 실제로 있는 번역 (generateMetadata 가 낸 hreflang 대체 링크). 못 읽으면 null = 전부 있다고 본다
function translatedLocales(): Set<string> | null {
  const found = new Set(
    Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]'), (l) => l.hreflang),
  );
  return found.size > 0 ? found : null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}

// 아래에서 올라오는 언어 시트. 지금 보는 페이지 그대로 언어만 바꾼다.
// replace 로 바꿔서 '뒤로'를 눌러도 이전 언어로 되돌아가지 않고, markReplace 로 기록 깊이도 그대로 둔다.
// 줄은 52px: 손잡이 16 + 제목 45 + 9 × 52 + 8 = 537px 라 아이폰 사파리에서 9개가 다 보인다
export function LanguageSheet({ open, onClose, returnFocusRef }: Props) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const current = useLocale();
  const currentRef = useRef<HTMLAnchorElement>(null);

  // 열릴 때마다 이 글의 번역 목록을 다시 읽는다 (글을 옮겨 다니면 head 가 바뀐다)
  const [available, setAvailable] = useState<Set<string> | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setAvailable(pathname.startsWith("/news/") ? translatedLocales() : null);
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t("language")}
      initialFocusRef={currentRef}
      returnFocusRef={returnFocusRef}
    >
      <ul>
        {LOCALES.map((l) => {
          const selected = l === current;
          const missing = !selected && available !== null && !available.has(l);
          return (
            <li key={l}>
              <Link
                ref={selected ? currentRef : undefined}
                href={missing ? "/" : pathname}
                locale={l}
                replace
                lang={l}
                hrefLang={l}
                aria-current={selected ? "true" : undefined}
                onClick={() => {
                  markReplace();
                  onClose();
                }}
                className={`press-row flex items-center gap-3 px-6 text-t5 ${missing ? "min-h-16 py-2" : "min-h-13"}`}
              >
                <span className="grid size-6 shrink-0 place-items-center">
                  {selected && <CheckIcon className="text-brand-ink" />}
                </span>
                <span className="min-w-0">
                  <span className={`block ${selected ? "font-semibold text-ink-900" : "text-ink-700"}`}>
                    {LOCALE_NAME[l]}
                  </span>
                  {missing && <span className="block text-t7 text-ink-600">{NOT_YET[l]}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
