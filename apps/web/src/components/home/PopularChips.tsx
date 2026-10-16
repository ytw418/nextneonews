import { getTranslations } from "next-intl/server";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Link } from "@/i18n/navigation";
import { listPopular } from "@/lib/articles";

// 3개도 안 되면 순위처럼 보이지 않아서 띄우지 않는다 (새 언어·조회가 아직 없을 때)
const MIN = 3;

// 홈 '지금 많이 읽는' 1~6위: 최근 이틀 동안 많이 본 글을 번호 알약으로 가로로 넘긴다.
// 아래 '지금 인기'(이번 주 5개 순위표)보다 짧은 기간이라 오늘 막 뜬 글이 먼저 잡힌다.
// 알약은 44px, 제목은 한 줄 말줄임. 폭 상한이 있어 360px 화면에서도 다음 알약이 살짝 보인다
export async function PopularChips({ locale }: { locale: string }) {
  const rows = await listPopular(locale, 6, 2);
  if (rows.length < MIN) return null;
  const t = await getTranslations("Feed");

  return (
    <section aria-labelledby="home-popular">
      <SectionHeader id="home-popular" title={t("popular")} />
      <ol className="rail gap-2 px-gutter pb-3">
        {rows.map((row, i) => (
          <li key={row.slug}>
            <Link
              href={`/news/${row.slug}`}
              className="press flex min-h-11 max-w-[min(17rem,calc(100vw-6rem))] items-center gap-2 rounded-full bg-card pr-4 pl-3.5 shadow-card"
            >
              <span className="text-t6 font-bold tabular-nums text-brand-ink">{i + 1}</span>
              <span className="min-w-0 truncate text-t6 font-semibold text-ink-900">{row.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
