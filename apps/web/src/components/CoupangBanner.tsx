"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { type CoupangBannerId, coupangWidgetSrc } from "@/lib/ads";

const noSubscribe = () => () => {};
const DEV = process.env.NODE_ENV !== "production";

interface Props {
  id: CoupangBannerId;
  label: string; // '광고' 표시 (편집 방침: 광고에는 언제나 표시를 한다)
  disclosure: string; // 이 페이지 언어의 대가성 문구
  disclosureKo?: string; // 한국어가 아닌 페이지에 함께 다는 한국어 원문
}

// 쿠팡 파트너스 다이나믹 배너. 공식 iframe 을 그대로 넣는다 (주소·속성을 바꾸지 않는다).
// 칸(문구·140px)은 서버 HTML 에 늘 있고, 보일지는 <head> 스크립트가 그리기 전에 정한다:
// 등록 주소이고 기기 시간대가 한국일 때만 html[data-coupang] 이 붙고, 아니면 globals.css 가 칸째 숨긴다 (lib/ads.ts).
// 개발 중에는 자리 표시만 보여 준다. 대가성 문구는 배너 바로 위에 본문 크기로 둔다.
// 떠다니기·덮개·클릭 유도 문구는 운영정책 위반이라 넣지 않는다
export function CoupangBanner({ id, label, disclosure, disclosureKo }: Props) {
  const shown = useSyncExternalStore(
    noSubscribe,
    () => document.documentElement.hasAttribute("data-coupang"),
    () => false,
  );
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  // 글 끝이라 화면에 가까워질 때 iframe 을 붙인다 (높이는 서버 HTML 부터 잡혀 있어 아래가 밀리지 않는다)
  useEffect(() => {
    const el = box.current;
    if (!shown || !el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        setNear(true);
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <aside className={DEV ? "mx-read my-8" : "coupang-slot mx-read my-8"}>
      <p className="mb-1 text-st12 text-ink-600">{label}</p>
      <p className="text-t6 text-ink-700">{disclosure}</p>
      {disclosureKo && (
        <p lang="ko" className="mt-1 text-t6 text-ink-700">
          {disclosureKo}
        </p>
      )}
      <div ref={box} className="mt-3 flex h-[140px]">
        {DEV ? (
          <div className="flex w-full items-center justify-center rounded-card border border-dashed border-line text-st12 text-ink-600">
            Coupang Partners {id}
          </div>
        ) : (
          near && (
            <iframe
              title="Coupang Partners"
              src={coupangWidgetSrc(id)}
              width="100%"
              height="140"
              frameBorder="0"
              scrolling="no"
              referrerPolicy="unsafe-url"
            />
          )
        )}
      </div>
    </aside>
  );
}
