import type { ReactNode } from "react";

import { TypeCover } from "@/components/guide/TypeCover";
import { SaveButton } from "@/components/SaveButton";
import { SECTION_TINT } from "@/data/sections";
import { Link } from "@/i18n/navigation";

interface Props {
  href: string;
  title: string;
  glyph: string; // 회차 "16" (카탈로그 밖 작품은 이니셜)
  locale: string;
  sub?: string; // 커버 안 제목 아래 (연도 · 방송사)
  rank?: number;
  rankLabel?: string; // 화면 읽기용 '오늘 K-드라마 랭킹 5위'
  saveId?: string; // 카탈로그 작품이면 하트
  meta?: ReactNode; // 커버 아래 한 줄 (별점·에디터 픽)
  className?: string; // 레일에서는 폭 (w-36)
}

// 드라마 3:4 카드: 틴트 커버(유령 글자 = 회차) 안에 제목·연도, 아래에 한 줄(별점 등). 순위가 있으면 왼쪽 위에 큰 숫자.
// 하트는 오른쪽 위, 링크 밖 형제로 겹쳐 둔다 (버튼을 <a> 안에 넣지 않는다). 커버 왼쪽 위 분류 배지는 쓰지 않는다 —
// 144px 레일 카드에서 긴 장르 이름(vi·ru·fr)이 하트와 겹쳐서. 장르는 목록의 칩과 상세에서 보인다
export function DramaCard({ href, title, glyph, locale, sub, rank, rankLabel, saveId, meta, className = "" }: Props) {
  return (
    <div className={`relative ${className}`}>
      <Link href={href} className="press-soft block rounded-card">
        <TypeCover tint={SECTION_TINT.drama} glyph={glyph} variant="grid" title={title} sub={sub} locale={locale}>
          {rank !== undefined && (
            <span aria-hidden className="numeral absolute top-1.5 left-3 text-display text-on-tint">
              {rank}
            </span>
          )}
        </TypeCover>
        {rank !== undefined && rankLabel && <span className="sr-only">{rankLabel}</span>}
        {meta && <span className="mt-2 flex items-center gap-1 text-st12 font-semibold tabular-nums text-ink-600">{meta}</span>}
      </Link>
      {saveId && <SaveButton kind="drama" id={saveId} title={title} className="absolute top-1 right-1 bg-tape" />}
    </div>
  );
}
