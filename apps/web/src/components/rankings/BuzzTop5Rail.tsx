import { getTranslations } from "next-intl/server";

import { EntityAvatar } from "@/components/rankings/EntityAvatar";
import { RankChange } from "@/components/rankings/RankChange";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Link } from "@/i18n/navigation";
import { CHART_TINT, displayName, getEntities, getLatestSnapshot } from "@/lib/rankings";

const TAKE = 5;

// 홈용 K-pop 화제성 Top5 가로 카드: 원형 사진(64px) · 순위 · 이름 · 변동, 끝에 '전체 순위 →'.
// 차트가 아직 없거나 3명도 안 되면 띄우지 않는다
export async function BuzzTop5Rail({ locale }: { locale: string }) {
  const snapshot = await getLatestSnapshot("kpop");
  if (!snapshot || snapshot.items.length < 3) return null;
  const top = snapshot.items.slice(0, TAKE);
  const [t, entities] = await Promise.all([getTranslations("Rankings"), getEntities(top.map((i) => i.entityId))]);

  return (
    <section aria-labelledby="home-buzz">
      <SectionHeader id="home-buzz" title={t("chart.kpop.title")} href="/rankings/kpop" linkLabel={t("fullChart")} />
      <ol className="rail gap-2 px-gutter pb-3">
        {top.map((item) => {
          const name = displayName(item.names, locale, item.entityId);
          return (
            <li key={item.entityId} className="w-28">
              <Link
                href={`/rankings/kpop#r-${item.entityId}`}
                className="press relative flex h-full flex-col items-center gap-2 rounded-card bg-card px-2 pt-4 pb-3 text-center shadow-card"
              >
                <span className="relative">
                  <EntityAvatar name={name} src={entities.get(item.entityId)?.photo?.card} tint={CHART_TINT.kpop} size={64} />
                  <span
                    className={`absolute -top-1 -left-1 flex size-6 items-center justify-center rounded-full text-t7 font-bold tabular-nums ${
                      item.rank === 1 ? "bg-brand text-white" : "bg-floating text-ink-900 ring-1 ring-line"
                    }`}
                  >
                    {item.rank}
                  </span>
                </span>
                <span className="line-clamp-2 text-t6 leading-row font-semibold text-ink-900">{name}</span>
                <RankChange rank={item.rank} prevRank={item.prevRank} className="mt-auto" quiet />
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
