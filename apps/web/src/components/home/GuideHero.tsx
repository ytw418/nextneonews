import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { sectionCount } from "@/components/guide/sectionCount";
import { TrackClicks } from "@/components/guide/TrackClicks";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SECTION_ICON3D } from "@/data/icons3d";
import { SECTION_PATH, SECTIONS } from "@/data/sections";
import { Link } from "@/i18n/navigation";

// 홈 '韓国ガイド': 2×2 낮은 회색 카드(3D 아이콘 + 이름 + 항목 수). 첫 화면은 오늘 소식에 내주고 그 아래에 둔다.
// 한 줄 설명은 좁은 칸에서 뜻 중간에 잘려서 뺐다 (섹션 화면에서 보인다)
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
                className="press-soft flex h-full min-h-18 items-center gap-2 rounded-card bg-band py-3 pr-2 pl-2.5 text-ink-900"
              >
                <Image
                  src={SECTION_ICON3D[section]}
                  unoptimized
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 shrink-0 drop-shadow-sm"
                />
                <span className="min-w-0">
                  <span className="line-clamp-2 block text-t6 leading-row font-bold break-words">
                    {t(`sections.${section}.title`)}
                  </span>
                  <span className="block text-st12 font-semibold tabular-nums text-ink-600">
                    {t(`sections.${section}.count`, { count })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </TrackClicks>
    </section>
  );
}
