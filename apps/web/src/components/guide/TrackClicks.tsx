"use client";

import type { ReactNode } from "react";

import { type TrackEvent, track } from "@/lib/track";

// 서버에서 그린 링크 묶음(타일·교차 레일)의 클릭을 한 곳에서 잰다. 링크 줄은 서버 컴포넌트 그대로 두고
// 눌린 <a> 의 주소(언어 접두사 뺀 경로)를 to 로 보낸다
export function TrackClicks({
  event,
  from,
  className,
  children,
}: {
  event: "guide_tile_open" | "cross_rail_click";
  from: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={className}
      onClickCapture={(e) => {
        const link = (e.target as Element).closest("a[href]");
        if (!link) return;
        const path = new URL(link.getAttribute("href")!, window.location.href).pathname;
        // 이벤트 이름은 track.ts 의 TrackEvent 에 함께 들어간다 (저장·평가 기반 패키지)
        track(event as TrackEvent, { from, to: path.replace(/^\/[a-z]{2}(-[a-z]{2})?(?=\/|$)/, "") || "/" });
      }}
    >
      {children}
    </div>
  );
}
