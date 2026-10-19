import type { Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { coverGlyph } from "@/components/guide/glyph";
import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { ListRow } from "@/components/ui/ListRow";
import { Meta } from "@/components/ui/Meta";
import type { ClinicEntry } from "@/data/clinic";
import { SECTION_TINT } from "@/data/sections";

import { painPhrase, recoveryPhrase } from "./format";

// 시술 목록 한 줄 (허브·같은 분야 다른 시술): 회복 일수 타이포 커버 · 이름 · 회복 · 통증 · 수술
export async function ProcedureRow({ entry, locale }: { entry: ClinicEntry; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Clinic" });
  return (
    <ListRow
      href={`/clinic/${entry.slug}`}
      left={<TypeCover tint={SECTION_TINT.clinic} glyph={coverGlyph({ kind: "clinic", downtimeDays: entry.downtimeDays })} variant="square" className="size-14" />}
      title={<Words text={entry.text.name} locale={locale} />}
      sub={
        <Meta
          parts={[
            recoveryPhrase(t, entry.downtimeDays),
            painPhrase(t, entry.painLevel),
            entry.surgical && t("facts.surgical"),
          ]}
        />
      }
      arrow
    />
  );
}
