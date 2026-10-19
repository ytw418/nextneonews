import { getTranslations } from "next-intl/server";

import { SectionHeader } from "@/components/ui/SectionHeader";

import { DramaCard } from "./DramaCard";
import type { TrendCard } from "./queries";

// '지금 화제' 가로 레일 (3:4 카드 2.5장이 첫 화면에 보인다). 랭킹에서 온 작품은 오늘 순위를 큰 숫자로,
// 편집 추천은 커버 아래 '에디터 픽'. 카탈로그 작품만 하트가 있다
export async function TrendingRail({ cards, locale }: { cards: TrendCard[]; locale: string }) {
  if (cards.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "Drama.hub" });
  return (
    <section aria-labelledby="drama-trending">
      <SectionHeader id="drama-trending" title={t("trendTitle")} />
      <ul className="rail rail-snap gap-3 px-gutter pb-1">
        {cards.map((card) => (
          <li key={card.key}>
            <DramaCard
              href={card.href}
              title={card.title}
              glyph={card.glyph}
              locale={locale}
              sub={card.year ? `${card.year} · ${card.network}` : undefined}
              rank={card.rank}
              rankLabel={card.rank ? t("trendRank", { rank: card.rank }) : undefined}
              saveId={card.saveId}
              meta={card.rank ? t("trendChart") : t("trendPick")}
              className="w-36"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
