import type { ReactNode } from "react";

// 시술 화면 본문 한 덩어리: h2(t4 굵게, SectionHeader 와 같은 크기) + 본문 t5. id 는 바로 가는 주소 (#risks)
export function ClinicSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 px-gutter pt-8">
      <h2 id={`${id}-title`} className="text-t4 font-bold text-ink-900">
        {title}
      </h2>
      <div className="mt-2 space-y-3 text-t5 text-ink-700">{children}</div>
    </section>
  );
}

// 점 목록 (위험·관리). 항목은 문구 배열 그대로
export function DotList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-ink-400">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
