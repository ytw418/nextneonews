"use client";

import { useSyncExternalStore } from "react";

import { dateLabel, timeAgo } from "@/lib/time";

const noSubscribe = () => () => {};

// 발행 시각. 서버 HTML(크롤러·첫 화면)에는 날짜('10월 19일')를 넣고, 하이드레이션 뒤 브라우저가 '3시간 전'으로 바꾼다.
// 서버가 상대 시각을 그리면 같은 글 목록도 재생성할 때마다 내용이 달라져 ISR 쓰기가 과금되고, 캐시가 오래 묵으면 틀린 말이 된다
export function TimeAgo({ iso, locale }: { iso: string; locale: string }) {
  const text = useSyncExternalStore(
    noSubscribe,
    () => timeAgo(new Date(iso), locale),
    () => dateLabel(new Date(iso), locale),
  );
  return <time dateTime={iso}>{text}</time>;
}
