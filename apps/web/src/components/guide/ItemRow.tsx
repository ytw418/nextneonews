import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

// 목록 한 줄 + 오른쪽 버튼 하나 (저장·저장 해제). ListRow 는 줄 전체가 링크라 안에 버튼을 둘 수 없어서
// 같은 모양으로 링크와 버튼을 나란히 둔다. <ul> 안에 넣는다. 서버·클라이언트 어디서나 쓴다 (훅 없음)
// 링크는 미리 받지 않는다(prefetch=false, 누를 때 받는다): 촘촘한 목록이 보일 때마다 화면 수십 개를 받아 데이터를 쓰고, 요청 때 만드는 언어 페이지를 한꺼번에 깨웠다
export function ItemRow({
  href,
  cover,
  title,
  sub,
  action,
  busy,
}: {
  href?: string; // 없으면 링크 없이 (불러오는 중·불러오지 못함)
  cover: ReactNode; // 왼쪽 썸네일 (CoverArt square size-14)
  title: ReactNode;
  sub?: ReactNode;
  action: ReactNode;
  busy?: boolean;
}) {
  const inner = "flex min-h-14 min-w-0 flex-1 items-center gap-3.5 py-2.5 pl-[var(--row-inset)]";
  const content = (
    <>
      <span className="shrink-0">{cover}</span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-t5 leading-row font-bold break-words text-ink-900">{title}</span>
        {sub && <span className="mt-0.5 block truncate text-t6 text-ink-600">{sub}</span>}
      </span>
    </>
  );

  return (
    <li className="relative flex items-center [--row-inset:var(--spacing-gutter)] after:absolute after:right-0 after:bottom-0 after:left-[var(--row-inset)] after:h-px after:bg-line last:after:hidden">
      {href ? (
        <Link href={href} prefetch={false} className={`press-row ${inner}`}>
          {content}
        </Link>
      ) : (
        <div className={inner} aria-busy={busy || undefined}>
          {content}
        </div>
      )}
      <span className="mr-2.5 shrink-0">{action}</span>
    </li>
  );
}
