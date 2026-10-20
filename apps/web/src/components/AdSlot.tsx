import type { ReactNode } from "react";

import { AdsenseUnit } from "@/components/AdsenseUnit";
import { adsenseClient } from "@/lib/ads";

// 광고 자리. 글에서는 AI 고지 뒤에만 둔다 (요약·핵심 요약·본문 사이에는 넣지 않는다).
// 운영 배포에서 게시자 id 와 이 자리의 광고 단위 id(slot)가 모두 있을 때만 수동 광고 단위를 넣고, 없으면 아무것도 그리지 않는다
// (그동안은 자동 광고가 자리를 고른다). 개발 중에는 자리 표시만 보여 준다.
// 높이를 미리 잡아 광고가 들어와도 아래가 밀리지 않게 하고, 안 채워지거나(unfilled) 스크립트가 막히면(AdsenseUnit 의 data-ad-blocked)
// 자리째 숨긴다 (글 끝이라 화면 밖에서 접힌다)
// fallback: 광고 단위가 아직 없을 때(애드센스 승인 전) 대신 그릴 자체 모듈 (퀴즈 배너·제휴). 광고 라벨은 붙이지 않는다.
// className: 바깥 여백. 글은 읽기 단(mx-read), 피드 슬롯은 이미 gutter 안이라 여백 없이
export function AdSlot({
  label,
  slot,
  fallback,
  className = "mx-read my-6",
}: {
  label: string;
  slot?: string;
  fallback?: ReactNode;
  className?: string;
}) {
  const client = adsenseClient();
  const unit = client && slot ? <AdsenseUnit client={client} slot={slot} /> : null;
  if (!unit && fallback) return <>{fallback}</>;
  if (!unit && process.env.NODE_ENV === "production") return null;
  return (
    <div className={`app-hide ${className} [&:has([data-ad-blocked])]:hidden [&:has([data-ad-status=unfilled])]:hidden`}>
      <p className="mb-1 text-st12 text-ink-600">{label}</p>
      <div className="min-h-[280px]">
        {unit ?? <div className="h-[280px] rounded-card border border-dashed border-line" />}
      </div>
    </div>
  );
}
