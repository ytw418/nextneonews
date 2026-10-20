import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { StampCount } from "@/components/travel/StampCount";
import { SECTION_TINT } from "@/data/sections";
import type { CoverSpec } from "@/data/types";
import { Link } from "@/i18n/navigation";

interface Props {
  slug: string;
  name: string;
  count: string; // '명소 4곳'
  cover: CoverSpec; // 동네 사진(위키미디어 CC) 또는 동네 아이콘 (data/cover.ts areaCover)
  placeSlugs: string[]; // 내 도장 n/4
  tagline?: string; // 타일 아래 한 줄 (허브에서만)
  wide?: boolean; // 허브 첫 타일: 두 칸 차지, 2:1
  locale: string;
}

// 동네 타일: 동네 사진(없으면 3D 아이콘) 커버 + 이름·명소 수 + 왼쪽 위 '내 도장 n/4'
// 링크는 미리 받지 않는다(prefetch=false, 누를 때 받는다): 촘촘한 목록이 보일 때마다 화면 수십 개를 받아 데이터를 쓰고, 요청 때 만드는 언어 페이지를 한꺼번에 깨웠다
export function AreaTile({ slug, name, count, cover, placeSlugs, tagline, wide = false, locale }: Props) {
  return (
    <Link href={`/travel/${slug}`} prefetch={false} className="press-soft block">
      <TypeCover
        tint={SECTION_TINT.travel}
        cover={cover}
        variant="tile"
        title={name}
        sub={count}
        locale={locale}
        className={wide ? "aspect-[2/1]!" : ""}
        // 허브 첫 타일(넓은 사진)은 첫 화면 LCP 라 먼저 받는다
        priority={wide}
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
