import type { Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { catalogPerson } from "@/data/drama/people";
import type { Drama } from "@/data/drama/types";

// 출연: 이름은 화면 언어(인물 사전 사본의 이름, 없으면 카탈로그 영문), 인물 페이지(/idol/slug)가 있을 때만 링크
export async function CastList({ cast, locale }: { cast: Drama["cast"]; locale: Locale }) {
  if (cast.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "Drama.detail" });
  return (
    <section aria-labelledby="drama-cast">
      <SectionHeader id="drama-cast" title={t("castTitle")} />
      <ul>
        {cast.map((c) => {
          const person = c.entityId ? catalogPerson(c.entityId, locale) : null;
          return (
            <ListRow
              key={`${c.name}:${c.role ?? ""}`}
              href={person?.slug ? `/idol/${person.slug}` : undefined}
              arrow={!!person?.slug}
              title={person?.name ?? c.name}
              sub={c.role ? t("castRole", { role: c.role }) : undefined}
            />
          );
        })}
      </ul>
    </section>
  );
}
