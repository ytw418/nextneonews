"use client";

import { useEffect, useRef } from "react";

// 상단바 가운데 제목. 페이지의 보이는 h1 이 상단바 밑으로 올라가면 나타난다.
// 양옆 98px 은 줄 여백 10 + 오른쪽 버튼 둘(언어·메뉴 44+44). 왼쪽도 같은 폭이라 가운데가 맞는다.
// 스크롤마다 다시 그리지 않게 data-show 를 DOM 에 바로 단다
export function HeaderTitle({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const title = ref.current;
    if (!title) return;
    const heading = document.querySelector("main h1:not(.sr-only)");
    if (!heading) {
      // 보이는 제목이 없는 화면이면 처음부터 띄운다
      title.toggleAttribute("data-show", true);
      return;
    }
    // 노치 아래 상단바 높이만큼 위를 잘라 낸 영역에서 h1 이 빠져나가면 = 바 밑으로 들어감
    const barBottom = Math.round(title.closest("header")?.getBoundingClientRect().bottom ?? 48);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        title.toggleAttribute("data-show", !entry.isIntersecting && entry.boundingClientRect.top < barBottom);
      },
      { rootMargin: `-${barBottom}px 0px 0px 0px` },
    );
    observer.observe(heading);
    return () => observer.disconnect();
  }, [text]);

  return (
    <span
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-x-[98px] top-1/2 -translate-y-1/2 truncate text-center text-chrome-title font-semibold text-ink-900 opacity-0 transition-opacity duration-150 data-[show]:opacity-100"
    >
      {text}
    </span>
  );
}
