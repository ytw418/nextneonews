import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

import { prisma } from "@kmedia/db";

import { log } from "../log";
import { assertBudget } from "./budget";
import { costUsd, isKnownModel, worstCaseUsd } from "./models";

let client: Anthropic | undefined;
export function getClient(): Anthropic {
  // ANTHROPIC_API_KEY 는 레포 루트 .env 에서 읽는다 (src/env.ts)
  client ??= new Anthropic();
  return client;
}

export class RefusalError extends Error {}

export async function logCost(task: string, model: string, usage: Anthropic.Beta.BetaUsage): Promise<void> {
  if (!isKnownModel(model)) {
    log.warn("cost: unknown model price, using fallback price", { model });
  }
  await prisma.costLog.create({ data: { kind: "LLM", amountUsd: costUsd(model, usage), ref: `${task}:${model}` } });
}

export interface StructuredCall<S extends z.ZodType> {
  task: string; // 비용 기록·로그용 이름 (예: "score", "write")
  model: string;
  system: string; // 단계별 고정 지침. 캐시된다
  user: string;
  schema: S;
  effort: "low" | "medium" | "high";
  maxTokens?: number;
}

// 구조화 출력(JSON 스키마)으로 한 번 호출하고, 사용량을 CostLog 에 남긴다.
export async function callStructured<S extends z.ZodType>(call: StructuredCall<S>): Promise<z.infer<S>> {
  const maxTokens = call.maxTokens ?? 16000;
  await assertBudget(worstCaseUsd(call.model, call.system.length + call.user.length, maxTokens));

  const response = await getClient().beta.messages.parse({
    model: call.model,
    max_tokens: maxTokens,
    system: [{ type: "text", text: call.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: call.user }],
    output_config: { effort: call.effort, format: betaZodOutputFormat(call.schema) },
    // 정책 거절 시 서버가 정한 대체 모델로 다시 시도한다. 대체가 없는 모델(Haiku)은 그대로 거절된다.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  await logCost(call.task, response.model, response.usage);

  if (response.stop_reason === "refusal") {
    throw new RefusalError(`${call.task}: refused (${response.stop_details?.category ?? "unknown"})`);
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error(`${call.task}: hit max_tokens`);
  }
  if (response.parsed_output == null) {
    throw new Error(`${call.task}: structured output missing`);
  }
  return response.parsed_output as z.infer<S>;
}
