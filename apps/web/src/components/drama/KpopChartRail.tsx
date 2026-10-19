import { getTranslations } from "next-intl/server";

import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { KpopChart } from "@/lib/kpop-chart";

// '한국에서 지금 듣는 노래': 애플 뮤직 한국 인기곡 1~10위. 줄마다 애플 뮤직 곡 페이지(새 탭), 아래에 출처·갱신 시각.
// 앨범 사진은 싣지 않는다 (권리·네트워크 이미지 0장 원칙). chart 가 null 이면(꺼짐·실패) 그리지 않는다
export async function KpopChartRail({ chart, locale }: { chart: KpopChart | null; locale: string }) {
  if (!chart) return null;
  const [t, tDrama] = await Promise.all([
    getTranslations({ locale, namespace: "Drama.hub" }),
    getTranslations({ locale, namespace: "Drama" }),
  ]);
  const updated = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(chart.updatedAt);

  return (
    <section aria-labelledby="drama-songs">
      <SectionHeader id="drama-songs" title={t("songsTitle")} />
      <ol>
        {chart.songs.map((song) => (
          <ListRow
            key={song.id}
            href={song.url}
            external
            ariaLabel={`${song.rank}. ${song.title} — ${song.artist} ${tDrama("newTab")}`}
            left={<span className="block w-6 text-center text-t4 font-bold tabular-nums text-ink-600">{song.rank}</span>}
            title={<span className="line-clamp-1">{song.title}</span>}
            sub={<span className="line-clamp-1">{song.artist}</span>}
          />
        ))}
      </ol>
      <p className="px-gutter pt-2 text-st12 text-ink-600">
        <time dateTime={chart.updatedAt.toISOString()}>{t("songsSource", { date: updated })}</time>
      </p>
    </section>
  );
}
