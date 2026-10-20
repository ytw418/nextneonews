import { TypeCover } from "@/components/guide/TypeCover";
import { Link } from "@/i18n/navigation";

// 가이드 섹션 타일 (/guide 허브 2×2 · 홈 가이드 레일): 흰 메모지 + 마스킹테이프, 오른쪽 아래로 잘린 큰 항목 수(유령 숫자).
// 네 섹션을 네 색으로 칠하지 않는다 — 한 화면 유채색은 틴트 1 + 체리 1 (docs/monetize/DESIGN.md §1-4). 섹션은 이름과 숫자로 가른다.
// 유령 글자도 섹션 이니셜(Be·Tr…) 대신 항목 수: 원소 기호처럼 읽히지 않고 9개 언어에서 같다
export function SectionTile({
  href,
  title,
  sub,
  count,
  locale,
  className = "",
}: {
  href: string;
  title: string;
  sub: string; // '제품 50개' 같은 항목 수 문장
  count: number;
  locale: string;
  className?: string; // 비율 (허브는 낮게)
}) {
  return (
    <Link href={href} className="press-soft relative block rounded-card shadow-card">
      <TypeCover
        variant="tile"
        tint="var(--card)"
        glyph={String(count)}
        title={title}
        sub={sub}
        locale={locale}
        className={className}
      />
    </Link>
  );
}
