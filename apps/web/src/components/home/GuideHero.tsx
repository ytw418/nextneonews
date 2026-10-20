import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { sectionCount } from "@/components/guide/sectionCount";
import { TrackClicks } from "@/components/guide/TrackClicks";
import { ChevronRightIcon } from "@/components/icons";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SECTION_ICON3D } from "@/data/icons3d";
import { SECTION_PATH, SECTIONS } from "@/data/sections";
import { Link } from "@/i18n/navigation";

// 홈 '韓国ガイド': 2×2 회색 카드. 색은 3D 아이콘이 내고 면은 무채색 (파스텔은 뺐다). 이름 · 한 줄 · 항목 수 알약.
// 뉴스보다 오래 남는 가이드를 홈 첫 화면 가까이에 크게 둔다. 비어 있는 섹션은 뺀다
export async function GuideHero({ locale }: { locale: string }) {
  const [t, tHome] = await Promise.all([
    getTranslations({ locale, namespace: "Guide" }),
    getTranslations({ locale, namespace: "Home" }),
  ]);
  const sections = SECTIONS.map((section) => ({ section, count: sectionCount(section) })).filter((s) => s.count > 0);
  if (sections.length === 0) return null;
  return (
    <section aria-labelledby="home-guide">
      <SectionHeader id="home-guide" title={t("railTitle")} href="/guide" linkLabel={tHome("seeAll")} />
      <TrackClicks event="guide_tile_open" from="home">
        <ul className="grid grid-cols-2 gap-2.5 px-gutter pb-2">
          {sections.map(({ section, count }) => (
            <li key={section}>
              <Link
                href={SECTION_PATH[section]}
                className="press-soft relative flex h-full min-h-44 flex-col overflow-hidden rounded-card bg-band p-4 text-ink-900"
              >
                <Image
                  src={SECTION_ICON3D[section]}
                  unoptimized
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 self-end drop-shadow-md"
                />
                <p className="mt-auto text-t5 font-bold">{t(`sections.${section}.title`)}</p>
                <p className="mt-0.5 line-clamp-1 text-st12 font-medium text-on-tint-sub">
                  {t(`sections.${section}.line`)}
                </p>
                <span className="mt-2.5 inline-flex min-h-7 items-center gap-0.5 self-start rounded-full bg-card pr-1.5 pl-2.5 shadow-card text-st12 font-bold tabular-nums">
                  {t(`sections.${section}.count`, { count })}
                  <ChevronRightIcon className="size-3.5 text-on-tint-sub" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </TrackClicks>
    </section>
  );
}
