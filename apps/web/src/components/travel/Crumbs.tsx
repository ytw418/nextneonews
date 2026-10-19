import { ChevronRightIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";

// 화면 위 작은 빵부스러기 (가이드 › 여행 › 동네). 지금 화면은 h1 이라 넣지 않는다. 글자는 작아도 누르는 영역은 44px
export function Crumbs({ label, items }: { label: string; items: { name: string; href: string }[] }) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-x-1 text-t7 font-semibold text-ink-600">
        {items.map((item, i) => (
          <li key={item.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRightIcon className="size-3.5 text-ink-400" />}
            <Link href={item.href} className="hit inline-flex min-h-8 items-center">
              {item.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
