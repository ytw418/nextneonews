import type { Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import type { Procedure } from "@/data/clinic/types";
import { SECTION_TINT } from "@/data/sections";
import { isMultiVisit, sessionPlan } from "@/lib/clinic";

import { durationText, painText, sessionsText } from "./format";

const PAIN_STEPS = [1, 2, 3] as const;

function Cell({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`rounded-card bg-card px-4 py-3 shadow-card ${wide ? "col-span-2" : ""}`}>
      <dt className="text-st12 font-semibold text-ink-600">{label}</dt>
      <dd className="mt-0.5 text-t4 font-bold tabular-nums text-ink-900">{children}</dd>
    </div>
  );
}

// 시술 사실 표: 회복 기간을 가장 크게(틴트 칸, 숫자 text-display), 그 아래 통증·소요·횟수·수술 여부 2×2.
// 회차 사이 간격이 있는 시술은 표 아래에 '짧은 여행에서는 한 번만 받을 수 있다'를 덧붙인다 (BM-VALIDATION P5-1)
export async function FactTable({ procedure, locale }: { procedure: Procedure; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Clinic" });
  const [min, max] = procedure.downtimeDays;
  const duration = durationText(t, procedure.durationMin);
  const sessions = sessionsText(t, procedure.sessions);
  // 데이터에 없는 칸(소요·횟수)은 빈 '—' 대신 빼고, 칸이 홀수면 마지막 칸을 넓힌다
  const cells: { key: string; label: string; value: ReactNode }[] = [
    {
      key: "pain",
      label: t("facts.pain"),
      value: (
        <>
          <span className="block">{painText(t, procedure.painLevel)}</span>
          <span aria-hidden className="mt-1.5 flex gap-1">
            {PAIN_STEPS.map((step) => (
              <span
                key={step}
                className={`h-1.5 w-6 rounded-full ${step <= procedure.painLevel ? "bg-ink-900" : "bg-line-strong"}`}
              />
            ))}
          </span>
        </>
      ),
    },
    ...(duration ? [{ key: "duration", label: t("facts.duration"), value: duration }] : []),
    ...(sessions ? [{ key: "sessions", label: t("facts.sessions"), value: sessions }] : []),
    { key: "type", label: t("facts.type"), value: procedure.surgical ? t("facts.surgical") : t("facts.nonSurgical") },
  ];

  return (
    <section aria-labelledby="clinic-facts" className="px-gutter pt-5">
      <h2 id="clinic-facts" className="sr-only">
        {t("facts.title")}
      </h2>
      <dl className="grid grid-cols-2 gap-2">
        <div
          className="col-span-2 rounded-card px-4 pt-3 pb-4 text-on-tint"
          style={{ backgroundColor: SECTION_TINT.clinic }}
        >
          <dt className="text-st12 font-semibold text-on-tint-sub">{t("facts.recovery")}</dt>
          <dd className="mt-1.5">
            {max === 0 ? (
              <span className="text-t3 font-bold">{t("facts.none")}</span>
            ) : (
              <span className="flex items-baseline gap-1.5">
                <span className="text-display font-bold tracking-tight tabular-nums">
                  {min === max ? max : t("facts.range", { min, max })}
                </span>
                <span className="text-t5 font-semibold">
                  {t(min === max ? "facts.daysUnit" : "facts.daysUnitRange", { count: max })}
                </span>
              </span>
            )}
          </dd>
        </div>
        {cells.map((cell, i) => (
          <Cell key={cell.key} label={cell.label} wide={cells.length % 2 === 1 && i === cells.length - 1}>
            {cell.value}
          </Cell>
        ))}
      </dl>
      {isMultiVisit(sessionPlan(procedure.sessions)) && (
        <p className="mt-3 text-t6 text-ink-700">{t("facts.multiVisit")}</p>
      )}
    </section>
  );
}
