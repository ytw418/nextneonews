import { isLocale } from "@kmedia/core";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { GuideCard } from "@/components/guide/GuideCard";
import { sectionCount } from "@/components/guide/sectionCount";
import { TrackClicks } from "@/components/guide/TrackClicks";
import { ChevronRightIcon } from "@/components/icons";
import { featuredMix } from "@/data/catalog";
import { SECTION_ICON3D } from "@/data/icons3d";
import { SECTION_PATH } from "@/data/sections";
import type { Section } from "@/data/types";
import { Link } from "@/i18n/navigation";

const TAKE = 3;

// 피드 사이에 끼우는 가이드 소개 (뉴스를 읽다가 가이드로 건너가게): 위아래 회색 띠로 피드와 끊고, 3D 아이콘 + 섹션 이름 · 한 줄,
// 그 섹션 대표 항목 3장 가로 레일, 끝에 '전체 보기'. 항목이 없으면 그리지 않는다
export async function GuideTeaser({ section, locale }: { section: Section; locale: string }) {
  if (!isLocale(locale) || sectionCount(section) === 0) return null;
  const [t, tHome, items] = await Promise.all([
    getTranslations({ locale, namespace: "Guide" }),
    getTranslations({ locale, namespace: "Home" }),
    featuredMix([section], locale, TAKE),
  ]);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={`teaser-${section}`} className="-mx-gutter my-3 border-y-8 border-band py-5">
      <Link href={SECTION_PATH[section]} className="press-soft flex items-center gap-3 px-gutter">
        <Image src={SECTION_ICON3D[section]} unoptimized alt="" width={48} height={48} className="size-12 shrink-0" />
        <span className="min-w-0 grow">
          <span id={`teaser-${section}`} className="block text-t5 font-bold text-ink-900">
            {t(`sections.${section}.title`)}
          </span>
          <span className="block truncate text-st12 font-medium text-ink-600">{t(`sections.${section}.line`)}</span>
        </span>
        <span className="flex shrink-0 items-center gap-0.5 text-t7 font-semibold text-ink-600">
          {tHome("seeAll")}
          <ChevronRightIcon className="size-4 text-ink-400" />
        </span>
      </Link>
      <TrackClicks event="guide_teaser_click" from={section}>
        <ul className="rail rail-snap mt-3 gap-2.5 px-gutter">
          {items.map((item) => (
            <li key={`${item.kind}:${item.id}`} className="w-32">
              <GuideCard item={item} locale={locale} />
            </li>
          ))}
        </ul>
      </TrackClicks>
    </section>
  );
}
