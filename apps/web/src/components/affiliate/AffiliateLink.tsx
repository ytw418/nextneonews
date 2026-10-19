"use client";

import { type ReactNode, useEffect, useRef } from "react";

import type { AffiliateHref } from "@/lib/affiliate";
import { track } from "@/lib/track";

// lib/affiliate.ts 의 AFFILIATE_REL 과 같은 값 (그 파일은 서버 전용이라 여기서 값을 가져올 수 없다)
const REL = "sponsored nofollow noopener";

// 상자가 이만큼 보이면 '봤다'로 센다 (affiliate_click / buy_box_view 비율의 분모)
const VIEW_RATIO = 0.5;

interface Click {
  partner: string;
  tagged: boolean;
  item?: string;
}

function trackAffiliate(placement: string, { partner, tagged, item }: Click) {
  track("affiliate_click", { partner, placement, tagged, ...(item ? { item } : {}) });
}

// 제휴 링크 하나 (버튼·글 안 링크). 새 탭, rel sponsored, 누르면 affiliate_click.
// 새 탭으로 열린다는 말은 children 안에 화면 읽기용으로 넣는다 (Affiliate.newTab)
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

// 서버에서 그린 제휴 상자의 클릭·노출을 잰다. 눌린 <a> 의 주소로 어느 파트너인지 찾고,
// 상자가 화면에 반 넘게 들어오면 buy_box_view 를 한 번 보낸다
export function AffiliateClicks({
  placement,
  links,
  className,
  children,
}: {
  placement: string;
  links: (Click & { href: string })[];
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const count = links.length;

  // 상자 하나에 한 번만 센다
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        track("buy_box_view", { placement, count });
        observer.disconnect();
      },
      { threshold: VIEW_RATIO },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [placement, count]);

  return (
    <div
      ref={ref}
      className={className}
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
