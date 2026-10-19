import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import type { CoverStyle } from "@/lib/cover";

type Size = "card" | "lead" | "hero";

interface Props {
  // 제목은 줄바꿈 처리까지 해서 넘긴다: 서버 화면은 Phrase, 피드 카드는 서버가 나눈 조각(ChunkedTitle).
  // 메모는 무한 스크롤(클라이언트)에서도 그려져서 여기서 BudouX 를 불러오지 않는다
  title: ReactNode;
  sticker: string;
  stamp: ReactNode; // 도장: 피드 카드는 발행 시각('3시간 전'), 글 히어로는 날짜 "10.15"
  style: CoverStyle;
  size?: Size;
  as?: "p" | "h1";
  className?: string; // 모서리·그림자 (테이프가 잘리지 않게 바깥 카드 대신 메모에 둥근 모서리를 줄 때)
}

// 크기별 메모지 모양 · 제목 자리 · 제목 글자 · 바닥 줄(도장·배지).
// lead 는 비율 대신 최소 높이라 짧은 제목 밑에 빈 줄이 남지 않는다. hero 는 제목을 가운데에
const BOX: Record<Size, string> = {
  card: "",
  lead: "min-h-[11rem]",
  hero: "min-h-[min(80vw,52svh)] w-full",
};
const PAD: Record<Size, string> = {
  card: "px-3.5 pt-5 pb-3",
  lead: "px-4 pt-7 pb-4",
  hero: "justify-center px-6 pt-12 pb-8",
};
const TITLE: Record<Size, string> = {
  card: "line-clamp-6 text-t5 leading-row",
  lead: "text-t3",
  hero: "text-t1",
};
const FOOT: Record<Size, string> = {
  card: "px-3 pb-3 text-st12",
  lead: "px-4 pb-4 text-st12",
  hero: "px-6 pb-6 text-t7",
};

// 사진 없는 기사의 커버: 카테고리 파스텔 메모지 + 마스킹테이프 + 도장 + 카테고리 배지.
// 메모지가 곧 제목이다. 노트 줄은 제목에만 긋고(memo-rules), 도장·배지 줄은 줄 없는 종이 위에 둔다.
// 내용이 넘치면(큰 글자) 비율보다 길어진다 (overflow-visible)
export function MemoCover({
  title,
  sticker,
  stamp,
  style,
  size = "card",
  as: Title = "p",
  className = "",
}: Props) {
  return (
    <div
      className={`tape relative flex flex-col overflow-visible text-on-tint ${BOX[size] || style.ratio} ${className}`}
      style={{ backgroundColor: style.tint, ["--tape-tilt" as string]: `${style.tapeTilt}deg` }}
    >
      <div className={`flex flex-1 flex-col ${PAD[size]}`}>
        <Title className={`title memo-rules font-bold ${TITLE[size]}`}>{title}</Title>
      </div>
      {/* 도장이 길어도(큰 글자·긴 언어) 배지와 겹치지 않게 흐름 안에서 줄을 바꾼다 */}
      <div className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-1 ${FOOT[size]}`}>
        <span className="font-semibold tabular-nums text-on-tint-sub">{stamp}</span>
        <Badge tone="paper">{sticker}</Badge>
      </div>
    </div>
  );
}
