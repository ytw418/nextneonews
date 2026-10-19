import { ChevronRightIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";

// 보이는 빵부스러기 (구조화 데이터 BreadcrumbList 와 같은 단계). 마지막은 지금 화면이라 링크가 아니다
export function Crumbs({ label, items }: { label: string; items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label={label} className="px-gutter pt-2">
      <ol className="flex flex-wrap items-center gap-x-0.5 text-t7 text-ink-600">
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center gap-x-0.5">
            {i > 0 && <ChevronRightIcon className="size-3.5 text-ink-400" />}
            {item.href ? (
              <Link href={item.href} className="press inline-flex min-h-11 items-center font-semibold text-ink-700">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
