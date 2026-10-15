import { Phrase } from "@/components/Phrase";
import type { CoverStyle } from "@/lib/cover";

interface Props {
  title: string;
  sticker: string;
  stamp: string; // 날짜 도장 "10.15"
  locale: string;
  style: CoverStyle;
  size?: "card" | "hero";
  as?: "p" | "h1";
  watermark?: string; // 기사 표지 배경에 깔리는 큰 단어
}

// 사진 없는 기사의 커버: 파스텔 메모지 + 마스킹테이프 + 날짜 도장 + 카테고리 스티커
export function MemoCover({ title, sticker, stamp, locale, style, size = "card", as: Title = "p", watermark }: Props) {
  const hero = size === "hero";
  return (
    <div
      className={`tape relative overflow-visible text-ink ${style.pattern} ${hero ? "aspect-[4/5] max-h-[70svh] w-full" : style.ratio}`}
      style={{ backgroundColor: style.tint, ["--tape-tilt" as string]: `${style.tapeTilt}deg` }}
    >
      {watermark && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-5 top-9 select-none font-display text-[88px] italic leading-[0.85] tracking-[-0.03em] text-ink/[0.09]"
        >
          {watermark}
        </span>
      )}
      <div className={`relative flex h-full flex-col ${hero ? "justify-end px-6 pb-20 pt-24" : "p-3.5 pt-5"}`}>
        <Title
          className={`title font-extrabold tracking-[-0.015em] ${
            hero ? "text-[32px] leading-[1.22]" : "line-clamp-6 text-[17px] leading-[1.32]"
          }`}
        >
          <Phrase text={title} locale={locale} />
        </Title>
      </div>
      <span
        className={`absolute font-label font-bold tabular-nums text-ink/55 ${
          hero ? "bottom-7 left-6 text-[13px] tracking-[0.12em]" : "bottom-3 left-3.5 text-[11px] tracking-[0.1em]"
        }`}
      >
        {stamp}
      </span>
      <span
        className={`absolute rounded-full border-2 border-white bg-cherry font-label font-bold uppercase tracking-wide text-white shadow-[0_2px_6px_rgba(0,0,0,0.15)] ${
          hero ? "bottom-6 right-6 px-3.5 py-1.5 text-[12px]" : "bottom-2.5 right-2.5 px-2.5 py-1 text-[10px]"
        }`}
        style={{ transform: `rotate(${style.tilt}deg)` }}
      >
        {sticker}
      </span>
    </div>
  );
}
