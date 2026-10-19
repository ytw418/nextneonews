import type { Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { kindIcon } from "@/components/guide/icons";
import { TrackClicks } from "@/components/guide/TrackClicks";
import { Words } from "@/components/guide/Words";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { featuredMix } from "@/data/catalog";
import { KIND_SECTION } from "@/data/sections";
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

// 상세·허브 화면 끝(광고 뒤)의 '이것도 둘러보세요' 가로 레일: 다른 섹션 대표 항목 3~4개.
// 카드는 섹션 틴트 띠(글리프·섹션 이름) + 제목. 보여 줄 게 하나도 없으면 그리지 않는다
export async function CrossRail({ from, locale, exclude }: { from: Section | "article"; locale: Locale; exclude?: string }) {
  const [t, items] = await Promise.all([
    getTranslations({ locale, namespace: "Guide" }),
    featuredMix(ORDER[from], locale, TAKE, exclude),
  ]);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="cross-rail">
      <SectionHeader id="cross-rail" title={t("crossTitle")} />
      <TrackClicks event="cross_rail_click" from={from}>
        <ul className="rail items-stretch gap-2 px-gutter pb-3">
          {items.map((item) => {
            const Icon = kindIcon(item.kind);
            const section = item.kind === "article" ? null : KIND_SECTION[item.kind];
            return (
              <li key={`${item.kind}:${item.id}`} className="w-40">
                <Link
                  href={item.href}
                  className="press flex h-full flex-col overflow-hidden rounded-card bg-card shadow-card"
                >
                  <span
                    className="flex items-center gap-1.5 px-3.5 pt-3 pb-2.5 text-on-tint"
                    style={{ backgroundColor: item.tint }}
                  >
                    <Icon className="size-4 shrink-0" />
                    {section && (
                      <span className="truncate text-t7 font-semibold">{t(`sections.${section}.title`)}</span>
                    )}
                  </span>
                  <span className="flex flex-1 flex-col px-3.5 pt-2.5 pb-3.5">
                    <span className="line-clamp-2 text-t6 leading-row font-bold text-ink-900">
                      <Words text={item.title} locale={locale} />
                    </span>
                    {item.sub && <span className="mt-0.5 truncate text-t7 text-ink-600">{item.sub}</span>}
                    {item.badge === "new" && (
                      <Badge tone="brandWeak" className="mt-2 self-start">
                        {t("newBadge")}
                      </Badge>
                    )}
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
