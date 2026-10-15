"use client";

import { useEffect } from "react";

// 기사를 열면 조회 수를 한 번 올린다. 같은 탭에서 다시 열거나 새로고침한 것은 세지 않는다
export function ViewPing({ articleId }: { articleId: string }) {
  useEffect(() => {
    const key = `hb:viewed:${articleId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // 저장소를 못 쓰면 그냥 센다
    }
    const url = `/api/views/${articleId}`;
    if (!navigator.sendBeacon?.(url)) {
      void fetch(url, { method: "POST", keepalive: true }).catch(() => undefined);
    }
  }, [articleId]);
  return null;
}
