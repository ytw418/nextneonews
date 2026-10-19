import type { Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { TravelEntry } from "@/data/travel";
import { SECTION_TINT } from "@/data/sections";
import { coverGlyph } from "@/lib/drama";

// 촬영지: 여행 카탈로그에 있는 명소만 (/travel/place/slug). 없으면 섹션째 숨긴다
export async function FilmingList({
  places,
  areaNames,
  locale,
}: {
  places: TravelEntry[];
  areaNames: Partial<Record<string, string>>; // 동네 slug → 화면 언어 이름
  locale: Locale;
}) {
  if (places.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "Drama.detail" });
  return (
    <section aria-labelledby="drama-filming">
      <SectionHeader id="drama-filming" title={t("filmingTitle")} />
      <ul>
        {places.map((place) => (
          <ListRow
            key={place.slug}
            href={`/travel/place/${place.slug}`}
            arrow
            left={<TypeCover tint={SECTION_TINT.travel} glyph={coverGlyph(place.text.name, locale)} variant="square" className="size-14" />}
            title={<Words text={place.text.name} locale={locale} />}
            sub={areaNames[place.area]}
          />
        ))}
      </ul>
    </section>
  );
}
