import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { StampCount } from "@/components/travel/StampCount";
import { SECTION_TINT } from "@/data/sections";
import { Link } from "@/i18n/navigation";

interface Props {
  slug: string;
  name: string;
  count: string; // '명소 4곳'
  glyph: string;
  placeSlugs: string[]; // 내 도장 n/4
  tagline?: string; // 타일 아래 한 줄 (허브에서만)
  wide?: boolean; // 허브 첫 타일: 두 칸 차지, 2:1
  locale: string;
}

// 동네 타일: 틴트 타이포 커버(동네 글자) + 이름·명소 수 + 왼쪽 위 '내 도장 n/4'
export function AreaTile({ slug, name, count, glyph, placeSlugs, tagline, wide = false, locale }: Props) {
  return (
    <Link href={`/travel/${slug}`} className="press-soft block">
      <TypeCover
        tint={SECTION_TINT.travel}
        glyph={glyph}
        variant="tile"
        title={name}
        sub={count}
        locale={locale}
        className={wide ? "aspect-[2/1]!" : ""}
      >
        <StampCount slugs={placeSlugs} className="absolute top-2.5 left-2.5" />
      </TypeCover>
      {tagline && (
        <p className="mt-2 line-clamp-2 text-t7 text-ink-600">
          <Words text={tagline} locale={locale} />
        </p>
      )}
    </Link>
  );
}
