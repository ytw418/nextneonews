import { ExternalIcon } from "@/components/icons";

// 공식 출처 링크 묶음 (법령·공공기관). 새 탭으로 열고 화면 읽기에는 그렇다고 알린다
export function SourceLinks({
  label,
  newTab,
  links,
}: {
  label: string;
  newTab: string;
  links: { href: string; text: string }[];
}) {
  return (
    <div>
      <p className="text-t7 font-semibold text-ink-600">{label}</p>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 py-1 text-t6 font-semibold text-brand-ink underline underline-offset-4"
            >
              {link.text}
              <ExternalIcon className="size-4 shrink-0" />
              <span className="sr-only">{newTab}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
