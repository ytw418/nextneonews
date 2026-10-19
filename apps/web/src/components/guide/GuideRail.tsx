import { getTranslations } from "next-intl/server";

import { SECTION_ICON } from "@/components/guide/icons";
import { TrackClicks } from "@/components/guide/TrackClicks";
import { Words } from "@/components/guide/Words";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SECTION_PATH, SECTION_TINT, SECTIONS } from "@/data/sections";
import { Link } from "@/i18n/navigation";

// 홈 일정 레일 아래 '가이드' 4칸: 섹션 틴트 메모 + 글리프 + 이름 + 한 줄. 누르면 섹션 허브로.
// 섹션 이름·한 줄은 가이드 허브(/guide)의 타일과 같은 문구다
export async function GuideRail({ locale }: { locale: string }) {
  const [t, tHome] = await Promise.all([
    getTranslations({ locale, namespace: "Guide" }),
    getTranslations({ locale, namespace: "Home" }),
  ]);

  return (
    <section aria-labelledby="home-guide">
      <SectionHeader id="home-guide" title={t("railTitle")} href="/guide" linkLabel={tHome("seeAll")} />
      <TrackClicks event="guide_tile_open" from="home">
        <ul className="rail items-stretch gap-2 px-gutter pb-3">
          {SECTIONS.map((section) => {
            const Icon = SECTION_ICON[section];
            return (
              <li key={section} className="w-36">
                <Link
                  href={SECTION_PATH[section]}
                  style={{ backgroundColor: SECTION_TINT[section] }}
                  className="press flex h-full flex-col gap-3 rounded-card px-4 pt-4 pb-4 text-on-tint shadow-card"
                >
                  <Icon className="size-6" />
                  <span>
                    <span className="block text-t5 leading-row font-bold">
                      <Words text={t(`sections.${section}.title`)} locale={locale} />
                    </span>
                    <span className="mt-1 block text-t7 text-on-tint-sub">
                      <Words text={t(`sections.${section}.line`)} locale={locale} />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </TrackClicks>
    </section>
  );
}
