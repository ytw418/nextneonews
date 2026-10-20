import { TypeCover } from "@/components/guide/TypeCover";
import { sectionCover } from "@/data/cover";
import type { Section } from "@/data/types";
import { Link } from "@/i18n/navigation";

// 가이드 섹션 타일 (/guide 허브 2×2): 홈 GuideHero 와 같은 섹션 3D 아이콘 + 이름 + 항목 수 문장.
// 네 섹션을 네 색으로 칠하지 않는다 — 면은 흰색, 색은 아이콘이 낸다 (docs/design/REFRESH-2026-10-20.md)
export function SectionTile({
  href,
  title,
  sub,
  section,
  locale,
  className = "",
}: {
  href: string;
  title: string;
  sub: string; // '제품 50개' 같은 항목 수 문장
  section: Section;
  locale: string;
  className?: string; // 비율 (허브는 낮게)
}) {
  return (
    <Link href={href} className="press-soft relative block rounded-card shadow-card">
      <TypeCover
        variant="tile"
        tint="var(--card)"
        cover={sectionCover(section)}
        title={title}
        sub={sub}
        locale={locale}
        className={className}
        // 허브 타일은 낮아서(2:1) 제목이 오른쪽 위 아이콘 밑으로 들어간다
        textClassName="right-16 left-3"
      />
    </Link>
  );
}
