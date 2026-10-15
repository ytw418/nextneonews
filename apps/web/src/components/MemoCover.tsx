import { Phrase } from "@/components/Phrase";
import { Badge } from "@/components/ui/Badge";
import type { CoverStyle } from "@/lib/cover";

type Size = "card" | "lead" | "hero";

interface Props {
  title: string;
  sticker: string;
  stamp: string; // 날짜 도장 "10.15"
  locale: string;
  style: CoverStyle;
  size?: Size;
  as?: "p" | "h1";
  className?: string; // 모서리 등 (테이프가 잘리지 않게 바깥 카드 대신 메모에 둥근 모서리를 줄 때)
}

// 크기별 메모지 모양 · 제목 자리 · 제목 글자. 바닥 여백은 도장·배지 자리
const BOX: Record<Size, string> = {
  card: "",
  lead: "aspect-[4/3]",
  hero: "min-h-[min(112vw,70svh)] w-full",
};
const PAD: Record<Size, string> = {
  card: "p-3.5 pt-5 pb-12",
  lead: "px-4 pt-7 pb-14",
  hero: "justify-end px-6 pt-24 pb-20",
};
const TITLE: Record<Size, string> = {
  card: "line-clamp-6 text-t5 leading-row",
  lead: "text-t3",
  hero: "text-t1",
};
const CORNER: Record<Size, string> = {
  card: "bottom-3 left-3 text-st12",
  lead: "bottom-4 left-4 text-st12",
  hero: "bottom-6 left-6 text-t7",
};
const BADGE: Record<Size, string> = {
  card: "right-3 bottom-3",
  lead: "right-4 bottom-4",
  hero: "right-6 bottom-6",
};

// 사진 없는 기사의 커버: 카테고리 파스텔 메모지 + 마스킹테이프 + 날짜 도장 + 카테고리 배지.
// 메모지가 곧 제목이다. 내용이 넘치면(큰 글자) 비율보다 길어진다 (overflow-visible)
export function MemoCover({
  title,
  sticker,
  stamp,
  locale,
  style,
  size = "card",
  as: Title = "p",
  className = "",
}: Props) {
  return (
    <div
      className={`tape pattern-lines relative flex flex-col overflow-visible text-on-tint ${BOX[size] || style.ratio} ${className}`}
      style={{ backgroundColor: style.tint, ["--tape-tilt" as string]: `${style.tapeTilt}deg` }}
    >
      <div className={`relative flex flex-1 flex-col ${PAD[size]}`}>
        <Title className={`title font-bold ${TITLE[size]}`}>
          <Phrase text={title} locale={locale} />
        </Title>
      </div>
      <span className={`absolute font-semibold tabular-nums text-on-tint-sub ${CORNER[size]}`}>{stamp}</span>
      <Badge tone="paper" className={`absolute ${BADGE[size]}`}>
        {sticker}
      </Badge>
    </div>
  );
}
