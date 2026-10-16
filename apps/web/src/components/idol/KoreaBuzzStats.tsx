import { getTranslations } from "next-intl/server";

import { SectionHeader } from "@/components/ui/SectionHeader";
import type { KoreaBuzz } from "@/lib/entities";

// 이번 주 한국 반응: 더쿠 핫게 글 수 · 조회 · 댓글, 구글 트렌드 KR 에 오른 날 수. 숫자만 보인다
// (커뮤니티 글·이미지는 옮기지 않는다). 모두 0 이면 띄우지 않는다
export async function KoreaBuzzStats({ buzz, locale }: { buzz: KoreaBuzz; locale: string }) {
  if (buzz.posts + buzz.views + buzz.comments + buzz.trendDays === 0) return null;
  const t = await getTranslations("Idol");
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const stats = [
    { key: "posts", label: t("buzzPosts"), value: compact.format(buzz.posts) },
    { key: "views", label: t("buzzViews"), value: compact.format(buzz.views) },
    { key: "comments", label: t("buzzComments"), value: compact.format(buzz.comments) },
    { key: "trends", label: t("buzzTrends"), value: t("trendDays", { count: buzz.trendDays, days: buzz.days }) },
  ];

  return (
    <section aria-labelledby="idol-buzz">
      <SectionHeader id="idol-buzz" title={t("buzzTitle")} />
      <dl className="grid grid-cols-2 gap-3 px-gutter">
        {stats.map((s) => (
          <div key={s.key} className="rounded-card bg-card p-4 shadow-card">
            <dt className="text-st12 font-semibold text-ink-600">{s.label}</dt>
            <dd className="mt-0.5 text-t3 font-bold tabular-nums text-ink-900">{s.value}</dd>
          </div>
        ))}
      </dl>
      <p className="px-gutter pt-3 text-st12 text-ink-600">{t("buzzNote", { days: buzz.days })}</p>
    </section>
  );
}
