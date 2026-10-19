import type { Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Drama } from "@/data/drama/types";

import type { CastPerson } from "./queries";

// 출연: 이름은 화면 언어(위키데이터 이름, 없으면 영문), 인물 페이지(/idol/slug)가 있을 때만 링크
export async function CastList({
  cast,
  people,
  locale,
}: {
  cast: Drama["cast"];
  people: Map<string, CastPerson>;
  locale: Locale;
}) {
  if (cast.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "Drama.detail" });
  return (
    <section aria-labelledby="drama-cast">
      <SectionHeader id="drama-cast" title={t("castTitle")} />
      <ul>
        {cast.map((c) => {
          const person = c.entityId ? people.get(c.entityId) : undefined;
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
