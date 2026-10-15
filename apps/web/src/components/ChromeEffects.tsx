"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// 방문 안에서 지금 기록(history entry)이 몇 번째인지. 첫 페이지 0, 이동할 때마다 +1.
// 값은 각 기록의 history.state.hbDepth 에 저장해서, 뒤로·앞으로·새로고침해도 그 기록의 깊이를 다시 읽는다.
// (예전 inAppNavigations 는 올라가기만 해서, 한 번 이동한 뒤로는 '뒤로'가 계속 router.back() 으로 사이트를 떠났다)
let depth = -1;
let replaceNext = false;

// 뒤로 버튼: 0 보다 크면 router.back(), 0 이면(공유 링크로 바로 들어옴·홈 화면 실행) 상위 페이지로 replace
export function navDepth(): number {
  return depth;
}

// 다음 이동이 replace(언어 바꾸기)임을 알린다. 깊이를 그대로 둔다
export function markReplace(): void {
  replaceNext = true;
}

// 화면에 그리는 것 없이 레이아웃에 한 번만 둔다: 스크롤 표시(상단바 선)와 기록 깊이
export function ChromeEffects() {
  const pathname = usePathname();

  // 스크롤하면 html[data-scrolled] → 상단바 아래 머리카락 선
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      document.documentElement.toggleAttribute("data-scrolled", window.scrollY > 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const state = (window.history.state ?? {}) as Record<string, unknown>;
    if (typeof state.hbDepth === "number") {
      // 이미 있던 기록으로 돌아옴 (뒤로·앞으로·새로고침)
      depth = state.hbDepth;
    } else {
      // 새 기록. App Router 의 키(__NA 등)를 지키려고 기존 state 를 펼쳐서 덧붙인다
      depth = replaceNext ? Math.max(depth, 0) : depth + 1;
      window.history.replaceState({ ...state, hbDepth: depth }, "");
    }
    replaceNext = false;
  }, [pathname]);

  return null;
}
