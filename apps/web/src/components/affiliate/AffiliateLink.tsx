"use client";

import type { ReactNode } from "react";

import type { AffiliateHref } from "@/lib/affiliate";
import { type TrackEvent, track } from "@/lib/track";

// lib/affiliate.ts 의 AFFILIATE_REL 과 같은 값 (그 파일은 서버 전용이라 여기서 값을 가져올 수 없다)
const REL = "sponsored nofollow noopener";

interface Click {
  partner: string;
  tagged: boolean;
  item?: string;
}

// 제휴 링크 클릭 이벤트 (이벤트 이름은 track.ts 의 TrackEvent 에 함께 들어간다 — 저장·평가 기반 패키지)
function trackAffiliate(placement: string, { partner, tagged, item }: Click) {
  track("affiliate_click" as TrackEvent, { partner, placement, tagged, ...(item ? { item } : {}) });
}

// 제휴 링크 하나 (버튼·글 안 링크). 새 탭, rel sponsored, 누르면 affiliate_click
export function AffiliateLink({
  href,
  placement,
  itemId,
  className,
  children,
}: {
  href: AffiliateHref;
  placement: string;
  itemId?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href.href}
      target="_blank"
      rel={REL}
      className={className}
      onClick={() => trackAffiliate(placement, { partner: href.partner, tagged: href.tagged, item: itemId })}
    >
      {children}
    </a>
  );
}

// 서버에서 그린 제휴 줄(ListRow) 묶음의 클릭을 잰다. 눌린 <a> 의 주소로 어느 파트너인지 찾는다
export function AffiliateClicks({
  placement,
  links,
  children,
}: {
  placement: string;
  links: (Click & { href: string })[];
  children: ReactNode;
}) {
  return (
    <div
      onClickCapture={(e) => {
        const href = (e.target as Element).closest("a[href]")?.getAttribute("href");
        const hit = href ? links.find((l) => l.href === href) : undefined;
        if (hit) trackAffiliate(placement, hit);
      }}
    >
      {children}
    </div>
  );
}
