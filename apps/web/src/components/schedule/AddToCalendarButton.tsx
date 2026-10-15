"use client";

import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/Button";

const subscribe = () => () => {};
// 아이폰·아이패드·맥 사파리는 .ics 를 열면 기본 '캘린더에 추가' 미리보기가 뜬다
const isApple = () => /iPhone|iPad|Macintosh/.test(navigator.userAgent);

// 기본은 .ics (download 속성을 달지 않아야 iOS 가 파일 저장 대신 캘린더 미리보기를 띄운다).
// 애플 기기가 아니면 하이드레이션 뒤 구글 캘린더 '일정 추가' 화면으로 바꾼다. 확인 토스트는 없다 (OS 화면이 곧 확인)
export function AddToCalendarButton({
  icsHref,
  googleHref,
  label,
  block,
  className,
}: {
  icsHref: string;
  googleHref: string;
  label: string;
  block?: boolean;
  className?: string;
}) {
  const apple = useSyncExternalStore(subscribe, isApple, () => true);
  return (
    <Button
      size="xl"
      variant="primary"
      block={block}
      className={className}
      href={apple ? icsHref : googleHref}
      external={!apple}
    >
      {label}
    </Button>
  );
}
