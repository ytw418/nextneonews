"use client";

import {
  CATEGORY_GROUPS,
  type CategoryKey,
  categoryFromSlug,
  categorySlug,
  type Locale,
  LOCALE_NAME,
} from "@kmedia/core";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { ChevronRightIcon, GlobeIcon, MenuIcon, TicketIcon } from "@/components/icons";
import { LanguageSheet } from "@/components/LanguageSheet";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { IconButton } from "@/components/ui/IconButton";
import { Link, usePathname } from "@/i18n/navigation";
import { categoryTint } from "@/lib/cover";

const GROUPS = Object.entries(CATEGORY_GROUPS) as [keyof typeof CATEGORY_GROUPS, readonly CategoryKey[]][];

// 메뉴 시트 아래쪽 줄 (일정·언어). 왼쪽 동그라미 아이콘, 오른쪽 꺾쇠
const ROW = "press-row flex min-h-14 w-full items-center gap-3 px-6 text-left text-t5 font-semibold text-ink-900";

// 상단바 오른쪽 끝 햄버거. 카테고리(묶음별, 글이 있는 것만)·일정·언어를 한 시트에 모은다.
// categories 는 서버에서 listActiveCategories 로 받은 '글이 있는 카테고리'
export function MenuButton({ categories }: { categories: readonly CategoryKey[] }) {
  const t = useTranslations("Nav");
  const tCat = useTranslations("Category");
  const tGroup = useTranslations("CategoryGroup");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  const current = pathname.startsWith("/c/") ? categoryFromSlug(pathname.slice(3)) : undefined;
  const groups = GROUPS.map(([group, keys]) => ({
    group,
    keys: keys.filter((c) => categories.includes(c)),
  })).filter((g) => g.keys.length > 0);

  return (
    <>
      <IconButton
        ref={ref}
        label={t("menu")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </IconButton>

      <BottomSheet open={open} onClose={close} title={t("menu")} returnFocusRef={ref}>
        {/* 카테고리 칩은 메모 커버와 같은 카테고리 틴트. 지금 보는 카테고리만 브랜드로 채운다 */}
        {groups.map(({ group, keys }) => (
          <section key={group} aria-labelledby={`menu-${group}`} className="px-6 pb-4">
            <h3 id={`menu-${group}`} className="pb-2 text-t7 font-semibold text-ink-600">
              {tGroup(group)}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {keys.map((c) => {
                const on = c === current;
                return (
                  <li key={c}>
                    <Link
                      href={`/c/${categorySlug(c)}`}
                      aria-current={on ? "page" : undefined}
                      onClick={close}
                      style={on ? undefined : { backgroundColor: categoryTint(c) }}
                      className={`press hit inline-flex min-h-[38px] items-center rounded-full px-3.5 text-t6 font-semibold ${
                        on ? "bg-brand text-white" : "text-on-tint"
                      }`}
                    >
                      {tCat(c)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <ul className="mt-1 border-t border-line pt-1">
          <li>
            <Link href="/schedule" onClick={close} className={ROW}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-weak text-brand-ink">
                <TicketIcon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">{t("schedule")}</span>
              <ChevronRightIcon className="size-5 shrink-0 text-ink-400" />
            </Link>
          </li>
          <li>
            {/* 메뉴를 닫으면서 언어 시트를 연다. 닫히면 초점은 메뉴 버튼으로 */}
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                setOpen(false);
                setLanguageOpen(true);
              }}
              className={ROW}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-fill-weak text-ink-700">
                <GlobeIcon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">{t("language")}</span>
              <span className="shrink-0 text-t6 font-normal text-ink-600">{LOCALE_NAME[locale]}</span>
              <ChevronRightIcon className="size-5 shrink-0 text-ink-400" />
            </button>
          </li>
        </ul>
      </BottomSheet>

      <LanguageSheet open={languageOpen} onClose={() => setLanguageOpen(false)} returnFocusRef={ref} />
    </>
  );
}
