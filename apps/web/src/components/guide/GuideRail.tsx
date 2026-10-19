import { getTranslations } from "next-intl/server";

import { sectionCount } from "@/components/guide/sectionCount";
import { TrackClicks } from "@/components/guide/TrackClicks";
import { TypeCover } from "@/components/guide/TypeCover";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SECTION_PATH, SECTION_TINT, SECTIONS } from "@/data/sections";
import { Link } from "@/i18n/navigation";

// 홈 일정 레일 아래 '가이드' 4칸 가로 레일: 섹션 타이포 커버 타일(이름 · 항목 수, 잘린 큰 글자). 누르면 섹션 허브로.
// 섹션 이름·글자는 가이드 허브(/guide)의 타일과 같다. 비어 있는 섹션은 빼서 '준비 중' 칸이 보이지 않게 한다
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
        <ul className="rail rail-snap gap-3 px-gutter pb-3">
          {sections.map(({ section, count }) => (
            <li key={section} className="w-40">
              <Link href={SECTION_PATH[section]} className="press-soft block rounded-card">
                <TypeCover
                  variant="tile"
                  tint={SECTION_TINT[section]}
                  glyph={t(`sections.${section}.glyph`)}
                  title={t(`sections.${section}.title`)}
                  sub={t(`sections.${section}.count`, { count })}
                  locale={locale}
                />
              </Link>
            </li>
          ))}
        </ul>
      </TrackClicks>
    </section>
  );
}
