"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// 애드센스 수동 광고 단위 (반응형). 마운트마다 한 번만 요청한다: 이미 처리된 <ins> 에 다시 넣으면
// "already have ads" 오류가 난다. 글을 옮기면 페이지가 새로 그려져 새 <ins> 로 다시 요청한다
export function AdsenseUnit({ client, slot }: { client: string; slot: string }) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    const ins = ref.current;
    if (!ins || ins.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 이미 처리된 칸 등 애드센스 오류는 무시한다 (자리는 아래에서 숨긴다)
    }
    // 광고 차단기 등으로 스크립트가 끝내 돌지 않으면 칸이 처리되지 않는다 (data-ad-status 도 안 붙는다).
    // 페이지를 다 불러오고(async 스크립트까지) 잠시 뒤에도 그대로면 data-ad-blocked 를 달아 AdSlot 이 자리째 숨긴다
    let timer = 0;
    const check = () => {
      timer = window.setTimeout(() => {
        if (!ins.dataset.adsbygoogleStatus) ins.dataset.adBlocked = "";
      }, 3000);
    };
    if (document.readyState === "complete") check();
    else window.addEventListener("load", check, { once: true });
    return () => {
      window.removeEventListener("load", check);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <ins
      ref={ref}
      className="adsbygoogle block"
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
