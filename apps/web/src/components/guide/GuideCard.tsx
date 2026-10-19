import { coverGlyph } from "@/components/guide/glyph";
import { TypeCover } from "@/components/guide/TypeCover";
import type { CatalogSummary } from "@/data/types";
import { Link } from "@/i18n/navigation";

// 가로 레일·2열 그리드의 카드 한 장 (DESIGN.md ③·⑪): 3:4 타이포 커버 하나가 카드 전체다.
// 커버 안에 분류 라벨·제목·부제·NEW 가 다 있어서 커버 밖에 제목을 또 쓰지 않는다
// 링크는 미리 받지 않는다(prefetch=false, 누를 때 받는다): 촘촘한 목록이 보일 때마다 화면 수십 개를 받아 데이터를 쓰고, 요청 때 만드는 언어 페이지를 한꺼번에 깨웠다
export function GuideCard({
  item,
  locale,
  label,
  newLabel,
}: {
  item: CatalogSummary;
  locale: string;
  label?: string; // 섹션 이름 (교차 레일에서 '여기서 저기로'가 보이게)
  newLabel?: string; // 없으면 NEW 를 달지 않는다 (목록이 전부 새것일 때 — badges.ts)
}) {
  return (
    <Link href={item.href} prefetch={false} className="press-soft block rounded-card">
      <TypeCover
        variant="grid"
        tint={item.tint}
        glyph={coverGlyph(item)}
        label={label}
        title={item.title}
        sub={item.sub}
        locale={locale}
        isNew={newLabel !== undefined && item.badge === "new"}
        newLabel={newLabel}
      />
    </Link>
  );
}
