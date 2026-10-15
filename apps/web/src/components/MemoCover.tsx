import { Phrase } from "@/components/Phrase";
import { Badge } from "@/components/ui/Badge";
import type { CoverStyle } from "@/lib/cover";

interface Props {
  title: string;
  sticker: string;
  stamp: string; // 날짜 도장 "10.15"
  locale: string;
  style: CoverStyle;
  size?: "card" | "hero";
  as?: "p" | "h1";
}

// 사진 없는 기사의 커버: 카테고리 파스텔 메모지 + 마스킹테이프 + 날짜 도장 + 카테고리 배지
export function MemoCover({ title, sticker, stamp, locale, style, size = "card", as: Title = "p" }: Props) {
  const hero = size === "hero";
  return (
    <div
      className={`tape pattern-lines relative flex flex-col overflow-visible text-on-tint ${hero ? "min-h-[min(112vw,70svh)] w-full" : style.ratio}`}
      style={{ backgroundColor: style.tint, ["--tape-tilt" as string]: `${style.tapeTilt}deg` }}
    >
      <div className={`relative flex flex-1 flex-col ${hero ? "justify-end px-6 pt-24 pb-20" : "p-3.5 pt-5 pb-12"}`}>
        <Title className={`title font-bold ${hero ? "text-t1" : "line-clamp-6 text-t5 leading-row"}`}>
          <Phrase text={title} locale={locale} />
        </Title>
      </div>
      <span
        className={`absolute font-semibold tabular-nums text-on-tint-sub ${
          hero ? "bottom-6 left-6 text-t7" : "bottom-3 left-3 text-st12"
        }`}
      >
        {stamp}
      </span>
      <Badge tone="paper" className={`absolute ${hero ? "right-6 bottom-6" : "right-3 bottom-3"}`}>
        {sticker}
      </Badge>
    </div>
  );
}
