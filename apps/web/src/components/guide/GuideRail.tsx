import { getTranslations } from "next-intl/server";

import { sectionCount } from "@/components/guide/sectionCount";
import { SectionTile } from "@/components/guide/SectionTile";
import { TrackClicks } from "@/components/guide/TrackClicks";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SECTION_PATH, SECTIONS } from "@/data/sections";

// 홈 일정 레일 아래 '가이드' 4칸 가로 레일: 섹션 메모지 타일(이름 · 항목 수, 잘린 큰 숫자). 누르면 섹션 허브로.
// 타일은 가이드 허브(/guide)와 같은 SectionTile. 비어 있는 섹션은 빼서 '준비 중' 칸이 보이지 않게 한다
export async function GuideRail({ locale }: { locale: string }) {
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
        {/* 위 여백: 가로 스크롤 줄은 세로로 넘친 것도 잘라서, 타일 위로 나온 마스킹테이프 자리를 둔다 */}
        <ul className="rail rail-snap gap-3 px-gutter pt-3 pb-3">
          {sections.map(({ section, count }) => (
            <li key={section} className="w-40">
              <SectionTile
                href={SECTION_PATH[section]}
                title={t(`sections.${section}.title`)}
                sub={t(`sections.${section}.count`, { count })}
                count={count}
                locale={locale}
              />
            </li>
          ))}
        </ul>
      </TrackClicks>
    </section>
  );
}
