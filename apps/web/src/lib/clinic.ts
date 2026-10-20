
// 클리닉 시술 사전의 판단 규칙 (화면은 components/clinic/*). 카탈로그는 import 하지 않아 클라이언트에서도 쓸 수 있다

// 시술 회차. 데이터의 sessions 는 영어 한 문장이라 9개 언어 사실 표에는 이 구조로 바꿔 보인다
export type SessionPlan =
  | { kind: "count"; min: number; max: number | null; approx?: true } // max 가 null 이면 'min 회 이상', approx 는 '약 n회'
  | { kind: "several" } // 횟수는 없지만 여러 번 가야 한다 (몇 달에 걸친 방문, 2주마다 새 장치)
  | { kind: "periodic" }; // 한 번에 끝나고 몇 달마다 다시 받는다 (스케일링)

const UNIT = String.raw`(?:sessions?|visits?|surger(?:y|ies))`;
const RULES: { re: RegExp; plan: (m: RegExpMatchArray) => SessionPlan }[] = [
  { re: new RegExp(String.raw`more than (\d+) ${UNIT}`, "i"), plan: (m) => ({ kind: "count", min: Number(m[1]) + 1, max: null }) },
  { re: new RegExp(String.raw`up to (\d+) ${UNIT}`, "i"), plan: (m) => ({ kind: "count", min: 1, max: Number(m[1]) }) },
  { re: new RegExp(String.raw`(\d+) or more ${UNIT}`, "i"), plan: (m) => ({ kind: "count", min: Number(m[1]), max: null }) },
  {
    re: new RegExp(String.raw`(?:(around|about) )?(\d+)(?:\s*[–-]\s*(\d+))? ${UNIT}`, "i"),
    plan: (m) => ({
      kind: "count",
      min: Number(m[2]),
      max: Number(m[3] ?? m[2]),
      ...(m[1] ? { approx: true as const } : {}),
    }),
  },
  { re: new RegExp(String.raw`several ${UNIT}`, "i"), plan: () => ({ kind: "several" }) },
  // 'New trays about every 2 weeks' (투명 교정): 주 단위로 되풀이되면 여러 번 가는 것
  { re: /every \d+(?:\s*[–-]\s*\d+)? weeks?/i, plan: () => ({ kind: "several" }) },
  { re: /every \d+(?:\s*[–-]\s*\d+)? months?/i, plan: () => ({ kind: "periodic" }) },
];

// 앞의 규칙이 먼저다 ('more than 1 session' 을 '1 session' 으로 읽지 않게). 못 읽으면 null (사실 표에 '—')
export function sessionPlan(sessions?: string): SessionPlan | null {
  if (!sessions) return null;
  for (const { re, plan } of RULES) {
    const m = sessions.match(re);
    if (m) return plan(m);
  }
  return null;
}

// 회차 사이 간격이 있어 짧은 여행에서는 한 번만 받고 돌아갈 수 있는 시술
export function isMultiVisit(plan: SessionPlan | null): boolean {
  if (!plan) return false;
  if (plan.kind === "several") return true;
  if (plan.kind === "periodic") return false;
  return (plan.max ?? Number.POSITIVE_INFINITY) >= 2;
}

// '병원에서 한국어로 보여 주기': 한국어 문구가 실제로 있고(영어로 채워진 게 아니고) 줄 수가 같을 때만 줄마다 짝을 짓는다
export function koreanLines(local: readonly string[], ko: readonly string[] | undefined, en: readonly string[]): string[] | null {
  if (!ko || ko.length !== local.length) return null;
  if (ko.every((line, i) => line === en[i])) return null;
  return [...ko];
}

