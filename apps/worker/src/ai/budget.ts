import { prisma } from "@kmedia/db";

// 사용자 지시: AI 비용 총 10만 원 상한 (2026-10-15). 환율은 보수적으로 1,500원으로 잡는다.
// LLM_BUDGET_KRW 로 바꿀 수 있다. 진짜 안전장치는 Anthropic 콘솔의 월 지출 한도다.
const KRW_PER_USD = 1500;

export class BudgetExceededError extends Error {}

export function budgetUsd(): number {
  const krw = Number(process.env.LLM_BUDGET_KRW ?? 100_000);
  return (Number.isFinite(krw) && krw > 0 ? krw : 100_000) / KRW_PER_USD;
}

// 지금까지 쓴 돈 + 아직 결과를 거두지 않은 배치의 최악 비용 (배치 비용은 거둘 때 CostLog 에 들어간다)
export async function spentUsd(): Promise<number> {
  const [logged, reserved] = await Promise.all([
    prisma.costLog.aggregate({ _sum: { amountUsd: true } }),
    prisma.aiBatch.aggregate({ _sum: { reservedUsd: true }, where: { status: "in_progress" } }),
  ]);
  return Number(logged._sum.amountUsd ?? 0) + Number(reserved._sum.reservedUsd ?? 0);
}

// 호출 전에 "지금까지 쓴 돈 + 이번 호출 최악의 비용"이 상한을 넘으면 막는다.
export async function assertBudget(worstCaseUsd: number): Promise<void> {
  const spent = await spentUsd();
  const limit = budgetUsd();
  if (spent + worstCaseUsd > limit) {
    throw new BudgetExceededError(
      `AI budget reached: spent $${spent.toFixed(2)} + next call up to $${worstCaseUsd.toFixed(2)} > limit $${limit.toFixed(2)}`,
    );
  }
}
