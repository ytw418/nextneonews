import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { AffiliateClicks } from "@/components/affiliate/AffiliateLink";
import { Badge } from "@/components/ui/Badge";
import { ListRow } from "@/components/ui/ListRow";
import { Link } from "@/i18n/navigation";
import {
  AFFILIATE_REL,
  affiliateHref,
  type AffiliateTarget,
  isAffiliatePartner,
  PARTNER_NAME,
  regionAllows,
} from "@/lib/affiliate";

interface Item {
  target: AffiliateTarget;
  label: string; // 줄 이름. 파트너 키("oliveyoung")를 그대로 넘기면 파트너 이름으로 바꾼다
  sub?: string; // 배송 지역 같은 한 줄. 비면 줄을 그리지 않는다
  itemId?: string;
}

interface Props {
  title: string;
  locale: string;
  placement: string; // 분석 이벤트 자리 이름 (beauty-detail, travel-prep …). clinic 으로 시작하면 던진다
  items: Item[];
  note?: string; // 상자 아래 한 줄 (배송 제한 등)
  compact?: boolean; // 본문 사이에 끼는 작은 상자: 제목·줄 부제·안내문 없이 고지와 줄만 (제목은 화면 읽기 이름으로)
}

// '어디서 사나'·'여행 준비' 제휴 상자 (docs/monetize/DESIGN.md ⑨). 콘텐츠 카드와 같은 흰 면이고 브랜드 색·채운 버튼이 없다.
// 첫 줄은 언제나 [PR 배지 + 수수료 고지 문장](공정위 심사지침 — 배지만 따로 두지 않는다), 그 아래 제목, 파트너 링크 줄 (새 탭, rel sponsored).
// 줄 순서는 부르는 쪽이 정한다 (뷰티는 partnersForLocale 순). 이 언어 독자가 살 수 없는 지역 전용 링크는 빼고, 남는 게 없으면 상자째 그리지 않는다
export async function AffiliateBox({ title, locale, placement, items, note, compact }: Props) {
  // 의료 글에는 제휴를 붙이지 않는다 (의료법 §56 — 시술 페이지는 광고 1칸만)
  if (placement.startsWith("clinic")) {
    throw new Error(`AffiliateBox: 의료 페이지에는 제휴 상자를 둘 수 없다 (placement: ${placement})`);
  }
  const rows = items
    .filter((item) => regionAllows(locale, item.target))
    .map((item) => ({
      ...item,
      name: isAffiliatePartner(item.label) ? PARTNER_NAME[item.label] : item.label,
      sub: item.sub?.trim() || undefined,
      link: affiliateHref(item.target),
    }));
  if (rows.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "Affiliate" });
  const headingId = `affiliate-${placement}`;
  const disclosureLink = (chunks: ReactNode) => (
    <Link href="/disclosure" className="font-semibold text-brand-ink underline underline-offset-4">
      {chunks}
    </Link>
  );

  return (
    <section
      aria-labelledby={compact ? undefined : headingId}
      aria-label={compact ? title : undefined}
      className="px-gutter pt-6"
    >
      <AffiliateClicks
        placement={placement}
        links={rows.map(({ link, itemId }) => ({ href: link.href, partner: link.partner, tagged: link.tagged, item: itemId }))}
        className="rounded-card bg-card shadow-card"
      >
        <p className="flex items-start gap-2 px-4 pt-4 text-st12 text-ink-600">
          <Badge tone="neutral" className="shrink-0">
            {t("prLabel")}
          </Badge>
          {/* 한국어는 어절 중간에서 줄이 바뀌지 않게 (링크가 섞여 Phrase 를 쓸 수 없다) */}
          <span className={`pt-0.5 ${locale === "ko" ? "[word-break:keep-all]" : ""}`}>
            {t.rich("disclosure", { link: disclosureLink })}
          </span>
        </p>
        {!compact && (
          <h2 id={headingId} className="px-4 pt-3 text-t5 font-bold text-ink-900">
            {title}
          </h2>
        )}
        <ul className={compact ? "pt-1" : ""}>
          {rows.map(({ name, sub, link, target }) => {
            const partner = PARTNER_NAME[target.partner];
            return (
              <ListRow
                key={`${name}:${link.href}`}
                href={link.href}
                external
                rel={AFFILIATE_REL}
                inset="card"
                title={
                  <>
                    {name}
                    <span className="sr-only"> {t("newTab")}</span>
                  </>
                }
                sub={compact ? undefined : sub}
                right={name === partner ? undefined : <span className="text-t7 text-ink-600">{partner}</span>}
              />
            );
          })}
        </ul>
        {note && !compact ? <p className="px-4 pb-4 text-t7 text-ink-600">{note}</p> : <div aria-hidden className="h-1" />}
      </AffiliateClicks>
    </section>
  );
}
