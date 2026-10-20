"use client";

import { useLocale, useTranslations } from "next-intl";

import { ArticleThumb } from "@/components/ArticleThumb";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Link } from "@/i18n/navigation";
import { useRecent } from "@/lib/recent";

const SHOW = 6;

// 홈 '続きから': 이 기기에서 최근 본 글 가로 레일 (지금 언어만, 최신순). 기록이 없으면(첫 방문) 아무것도 그리지 않는다.
// 서버 HTML 에는 없고 하이드레이션 뒤에 나타난다 — 레일이 가이드 아래라 첫 화면이 밀리지 않는다
export function ContinueRail() {
  const locale = useLocale();
  const t = useTranslations("Home");
  const items = useRecent()
    .filter((r) => r.locale === locale)
    .slice(0, SHOW);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="home-continue">
      <SectionHeader id="home-continue" title={t("continue")} />
      <ul className="rail rail-snap gap-2.5 px-gutter pb-1">
        {items.map((r) => (
          <li key={r.slug} className="w-64 shrink-0">
            <Link
              href={`/news/${r.slug}`}
              prefetch={false}
              className="press-soft flex items-center gap-3 rounded-card bg-band p-2.5"
            >
              <ArticleThumb item={{ slug: r.slug, category: r.category, imageUrl: r.imageUrl }} size={56} />
              <span className="line-clamp-2 min-w-0 text-t7 font-bold text-ink-900">{r.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
