import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { AffiliateClicks } from "@/components/affiliate/AffiliateLink";
import { ChevronDownIcon, ExternalIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { AFFILIATE_REL, affiliateHref, type AffiliateTarget, PARTNER_NAME } from "@/lib/affiliate";

interface Props {
  locale: string;
  target: AffiliateTarget; // partnersForLocale 1순위
  itemId: string;
  moreHref: string; // 아래 '어디서 사나' 상자 (#id)
}

// 제품 상세 첫 화면의 구매 줄: [PR 배지 + 수수료 고지] 다음 줄에 1순위 파트너 버튼 하나(weak — 채운 버튼은 쓰지 않는다)와
// 다른 곳 보기(아래 상자로). 고지를 버튼보다 먼저 둔다 (배지만 따로 두지 않는다)
export async function BuyStrip({ locale, target, itemId, moreHref }: Props) {
  const [t, tAff] = await Promise.all([
    getTranslations({ locale, namespace: "Beauty" }),
    getTranslations({ locale, namespace: "Affiliate" }),
  ]);
  // 고지는 한 줄로 (수수료 + 같은 가격). 긴 고지 문장은 아래 '어디서 사나' 상자 첫 줄에 그대로 있다
  const link = affiliateHref(target);
  const partner = PARTNER_NAME[target.partner];
  const disclosureLink = (chunks: ReactNode) => (
    <Link href="/disclosure" className="font-semibold text-brand-ink underline underline-offset-4">
      {chunks}
    </Link>
  );

  return (
    <div className="mx-gutter mt-3 rounded-card bg-card px-4 pt-3 pb-3 shadow-card">
      <p className="flex items-start gap-2 text-t7 text-ink-600">
        <Badge tone="neutral" className="shrink-0">
          {tAff("prLabel")}
        </Badge>
        <span className={`pt-0.5 ${locale === "ko" ? "[word-break:keep-all]" : ""}`}>
          {t.rich("buy.disclosure", { link: disclosureLink })}
        </span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <AffiliateClicks
          placement="beauty-detail-top"
          links={[{ href: link.href, partner: link.partner, tagged: link.tagged, item: itemId }]}
        >
          <Button size="m" variant="weak" href={link.href} external rel={AFFILIATE_REL}>
            {t("buy.at", { partner })}
            <ExternalIcon className="size-4" />
            <span className="sr-only">{t("newTab")}</span>
          </Button>
        </AffiliateClicks>
        <a
          href={moreHref}
          className="press inline-flex min-h-11 items-center gap-0.5 text-t7 font-semibold text-ink-600"
        >
          {t("buy.more")}
          <ChevronDownIcon className="size-4 text-ink-400" />
        </a>
      </div>
    </div>
  );
}
