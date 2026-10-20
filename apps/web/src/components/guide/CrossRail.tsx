import type { Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { newBadgeShows } from "@/components/guide/badges";
import { GuideCard } from "@/components/guide/GuideCard";
import { TrackClicks } from "@/components/guide/TrackClicks";
import { ChevronRightIcon } from "@/components/icons";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { featuredMix } from "@/data/catalog";
import { categorySection, KIND_SECTION } from "@/data/sections";
import type { Section } from "@/data/types";
import { Link } from "@/i18n/navigation";

// 다른 섹션을 먼저: 드라마에서는 촬영지(여행)·뷰티, 글에서는 돈이 나는 뷰티·여행부터
const ORDER: Record<Section | "article", Section[]> = {
  beauty: ["travel", "drama", "clinic"],
  travel: ["drama", "beauty", "clinic"],
  clinic: ["beauty", "travel", "drama"],
  drama: ["travel", "beauty", "clinic"],
  article: ["beauty", "travel", "drama", "clinic"],
};

const TAKE = 4;

// 상세·허브 화면 끝의 '이것도 둘러보세요' 가로 레일 (DESIGN.md ⑪): 다른 섹션 대표 항목 3~4장 + 끝에 '가이드 전체' 카드.
// 카드는 3:4 타이포 커버라 섹션 틴트가 섞여 '여기서 저기로'가 색으로 보인다. 보여 줄 게 하나도 없으면 그리지 않는다
// 글 끝(article)은 글 카테고리에 맞는 섹션을 맨 앞에 (뷰티 글 → 뷰티, 드라마·연예 → 드라마, 여행·푸드 → 여행)
function orderFor(from: Section | "article", category?: string): Section[] {
  if (from !== "article" || !category) return ORDER[from];
  const first = categorySection(category);
  return [first, ...ORDER.article.filter((s) => s !== first)];
}

export async function CrossRail({
  from,
  locale,
  exclude,
  category,
}: {
  from: Section | "article";
  locale: Locale;
  exclude?: string;
  category?: string; // 글 카테고리 (from="article" 일 때만)
}) {
  const [t, items] = await Promise.all([
    getTranslations({ locale, namespace: "Guide" }),
    featuredMix(orderFor(from, category), locale, TAKE, exclude),
  ]);
  if (items.length === 0) return null;
  const showNew = newBadgeShows(items);

  return (
    <section aria-labelledby="cross-rail">
      <SectionHeader id="cross-rail" title={t("crossTitle")} />
      <TrackClicks event="cross_rail_click" from={from}>
        <ul className="rail rail-snap gap-3 px-gutter pb-3">
          {items.map((item) => (
            <li key={`${item.kind}:${item.id}`} className="w-36">
              <GuideCard
                item={item}
                locale={locale}
                label={item.kind === "article" ? undefined : t(`sections.${KIND_SECTION[item.kind]}.title`)}
                newLabel={showNew ? t("newBadge") : undefined}
              />
            </li>
          ))}
          <li className="w-36">
            <Link
              href="/guide"
              className="press-soft flex aspect-[3/4] flex-col justify-end gap-1 rounded-card bg-fill-weak p-3 text-ink-900"
            >
              <span className="text-t6 leading-row font-bold">{t("moreCard")}</span>
              <ChevronRightIcon className="size-5 text-ink-600" />
            </Link>
          </li>
        </ul>
      </TrackClicks>
    </section>
  );
}
