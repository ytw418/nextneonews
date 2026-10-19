import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { SaveButton } from "@/components/SaveButton";
import { VisitedMark } from "@/components/travel/VisitedMark";
import { SECTION_TINT } from "@/data/sections";
import { Link } from "@/i18n/navigation";

interface Props {
  slug: string;
  name: string;
  sub: string; // 종류 · 역 도보 n분 (또는 동네)
  glyph: string; // 썸네일 유령 글자 (동네 글자). number 를 주면 쓰지 않는다
  number?: number; // 동네 버킷리스트 순번 — 주면 썸네일에 크게 보인다
  locale: string;
}

// 명소 한 줄: [틴트 썸네일(+도장 표시)] 이름 · 부제 → 명소 화면, 오른쪽 저장 하트.
// 하트는 링크 밖 형제로 둔다 (링크 안 버튼은 화면 읽기·키보드에서 겹친다). <ul>/<ol> 안에 넣는다
// 링크는 미리 받지 않는다(prefetch=false, 누를 때 받는다): 촘촘한 목록이 보일 때마다 화면 수십 개를 받아 데이터를 쓰고, 요청 때 만드는 언어 페이지를 한꺼번에 깨웠다
export function PlaceRow({ slug, name, sub, glyph, number, locale }: Props) {
  return (
    <li className="relative flex items-center pr-2.5 after:absolute after:right-0 after:bottom-0 after:left-[92px] after:h-px after:bg-line last:after:hidden">
      <Link
        href={`/travel/place/${slug}`}
        prefetch={false}
        className="press-row flex min-h-18 min-w-0 flex-1 items-center gap-4 py-3 pl-gutter"
      >
        <span className="relative block size-14 shrink-0">
          {/* 순번이 있으면 유령 글자 대신 순번만 (둘이 겹치면 읽기 어렵다) */}
          <TypeCover tint={SECTION_TINT.travel} glyph={number === undefined ? glyph : ""} variant="square" className="size-14">
            {number !== undefined && (
              <span aria-hidden className="absolute inset-0 grid place-items-center text-t3 font-bold tabular-nums">
                {number}
              </span>
            )}
          </TypeCover>
          <VisitedMark slug={slug} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-t5 font-bold leading-row text-ink-900">
            <Words text={name} locale={locale} />
          </span>
          <span className="mt-0.5 block text-t7 text-ink-600">{sub}</span>
        </span>
      </Link>
      <SaveButton kind="place" id={slug} title={name} />
    </li>
  );
}
