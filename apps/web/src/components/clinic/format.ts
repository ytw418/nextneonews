import type { Procedure } from "@/data/clinic/types";
import { sessionPlan } from "@/lib/clinic";

// 시술 사실(언어 무관 숫자)을 Clinic 네임스페이스 문구로. 허브 목록 메타·사실 표·메타 설명이 같은 말을 쓰게 한 곳에 둔다
export type ClinicT = (key: string, values?: Record<string, string | number>) => string;

export function recoveryText(t: ClinicT, [min, max]: Procedure["downtimeDays"]): string {
  if (max === 0) return t("facts.none");
  return min === max ? t("facts.daysOne", { count: max }) : t("facts.days", { min, max });
}

export function painText(t: ClinicT, level: Procedure["painLevel"]): string {
  return t(`facts.painLevel.${level}`);
}

// 목록 메타·메타 설명용 짧은 말: '회복 0–1일' · '통증 보통' (회복이 없으면 '회복 기간 없음' 한 마디)
export function recoveryPhrase(t: ClinicT, days: Procedure["downtimeDays"]): string {
  return days[1] === 0 ? t("facts.none") : t("listMeta.recovery", { value: recoveryText(t, days) });
}

export function painPhrase(t: ClinicT, level: Procedure["painLevel"]): string {
  return t("listMeta.pain", { level: painText(t, level) });
}

// 데이터에 없으면 null (표에는 '—')
export function durationText(t: ClinicT, duration: Procedure["durationMin"]): string | null {
  if (!duration) return null;
  const [min, max] = duration;
  return min === max ? t("facts.minutesOne", { count: min }) : t("facts.minutes", { min, max });
}

export function sessionsText(t: ClinicT, sessions: Procedure["sessions"]): string | null {
  const plan = sessionPlan(sessions);
  if (!plan) return null;
  if (plan.kind === "several") return t("facts.sessionsSeveral");
  if (plan.kind === "periodic") return t("facts.sessionsPeriodic");
  if (plan.max === null) return t("facts.sessionsAtLeast", { count: plan.min });
  if (plan.approx && plan.min === plan.max) return t("facts.sessionsAbout", { count: plan.min });
  return plan.min === plan.max
    ? t("facts.sessionsOne", { count: plan.min })
    : t("facts.sessionsRange", { min: plan.min, max: plan.max });
}

// 'YYYY-MM-DD' 기준일을 그 언어의 긴 날짜로 (2026년 10월 19일 · October 19, 2026)
export function longDate(locale: string, ymd: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${ymd}T00:00:00Z`));
}

// 바깥 출처 링크 글자: 주소의 호스트만 (www. 뺌)
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// 출처 목록 글자: 호스트 + 경로 (같은 사이트의 서로 다른 논문이 같은 이름으로 보이지 않게)
export function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}`;
  } catch {
    return url;
  }
}
