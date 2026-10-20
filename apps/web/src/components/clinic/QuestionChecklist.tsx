"use client";

import { useState } from "react";

import { CheckIcon } from "@/components/icons";

interface Props {
  id: string; // 섹션 제목 id (페이지 안 바로가기 #questions 와 같다)
  title: string;
  hint: string;
  items: string[]; // 이 언어 문구
  ko: string[] | null; // 줄마다 짝지은 한국어 (lib/clinic.ts koreanLines). 없으면 토글을 숨긴다
  showKoreanLabel: string;
  koreanHint: string;
  inset?: "gutter" | "read"; // 시술 화면 20 · 고르는 법(긴 글) 24
  className?: string;
}

// '병원에 물어볼 질문' 체크리스트. 상담 중에 하나씩 묻고 체크한다 (이 화면에서만, 저장하지 않는다).
// '병원에서 한국어로 보여 주기'를 켜면 줄마다 한국어를 크게 나란히 보여 직원에게 화면을 그대로 내밀 수 있다.
// 문구는 서버가 props 로 넘겨 HTML 에 그대로 실린다 (검색·화면 읽기)
export function QuestionChecklist({
  id,
  title,
  hint,
  items,
  ko,
  showKoreanLabel,
  koreanHint,
  inset = "gutter",
  className = "",
}: Props) {
  const [checked, setChecked] = useState<ReadonlySet<number>>(() => new Set());
  const [korean, setKorean] = useState(false);
  const showKo = korean && ko !== null;

  const toggle = (index: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (!next.delete(index)) next.add(index);
      return next;
    });

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`scroll-mt-16 ${inset === "read" ? "px-read" : "px-gutter"} ${className}`}
    >
      <h2 id={`${id}-title`} className="text-t4 font-bold text-ink-900">
        {title}
      </h2>
      <p className="mt-1 text-t6 text-ink-600">{hint}</p>

      {ko && (
        <button
          type="button"
          role="switch"
          aria-checked={korean}
          onClick={() => setKorean((on) => !on)}
          className="press-soft mt-4 flex min-h-12 w-full items-center justify-between gap-3 rounded-card bg-card px-4 py-2 text-left shadow-card"
        >
          <span className="text-t6 font-semibold text-ink-900">{showKoreanLabel}</span>
          <span
            aria-hidden
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${korean ? "bg-brand" : "bg-line-strong"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-card transition-transform ${korean ? "translate-x-5.5" : ""}`}
            />
          </span>
        </button>
      )}
      <p aria-live="polite" className="empty:hidden mt-2 text-t7 font-semibold text-brand-ink">
        {showKo ? koreanHint : ""}
      </p>

      <ul className="mt-3 overflow-hidden rounded-card bg-card shadow-card">
        {items.map((item, i) => {
          const on = checked.has(i);
          return (
            <li
              key={item}
              className="relative after:absolute after:right-0 after:bottom-0 after:left-4 after:h-px after:bg-line last:after:hidden"
            >
              <label className="flex min-h-14 cursor-pointer items-start gap-3 px-4 py-3">
                <input type="checkbox" checked={on} onChange={() => toggle(i)} className="peer sr-only" />
                <span
                  aria-hidden
                  className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 border-line-control text-white peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
                >
                  {on && <CheckIcon className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-t6 ${on ? "text-ink-600" : "text-ink-900"}`}>{item}</span>
                  {showKo && (
                    <span lang="ko" className="mt-1 block text-t5 leading-row font-bold text-ink-900">
                      {ko[i]}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
