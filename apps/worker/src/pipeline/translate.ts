import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { BATCH_LOCALES, type BatchLocale } from "@kmedia/core";
import { prisma } from "@kmedia/db";

import { assertBudget } from "../ai/budget";
import { getClient, thinkingFor } from "../ai/client";
import { BATCH_DISCOUNT, costUsd, isKnownModel, MODELS, worstCaseUsd } from "../ai/models";
import { TRANSLATE_SYSTEM } from "../ai/prompts";
import { log } from "../log";
import { looksLikeLocale } from "./checks";
import { clean, Localized } from "./localized";

// 영어판을 vi·id·fr·ru 로 옮긴다. 급하지 않으니 배치 API(50% 할인)로 보내고 다음 실행 때 결과를 거둔다.
// 매시간 Actions 가 `translate` 를 돌리면 새 글은 보통 1~2시간 안에 네 언어가 붙는다.

const KIND = "translate";
const MAX_TOKENS = 8000;
const FORMAT = zodOutputFormat(Localized);

// 대상 언어를 이름까지 적어 둔다. "target: ru" 만 주면 한국어로 답한 적이 있다
const TARGET: Record<BatchLocale, string> = {
  vi: "Target language: Vietnamese (vi, tiếng Việt). Write every field in Vietnamese.",
  id: "Target language: Indonesian (id, Bahasa Indonesia). Write every field in Indonesian.",
  fr: "Target language: French (fr, français). Write every field in French.",
  ru: "Target language: Russian (ru, русский язык). Write every field in Russian, in Cyrillic script.",
};

// custom_id 는 영문·숫자·_- 만 된다: "<articleId>_<locale>" (cuid 에는 _ 가 없다)
function customId(articleId: string, locale: BatchLocale): string {
  return `${articleId}_${locale}`;
}

function parseCustomId(id: string): { articleId: string; locale: BatchLocale } | null {
  const cut = id.lastIndexOf("_");
  const locale = id.slice(cut + 1);
  if (cut <= 0 || !(BATCH_LOCALES as readonly string[]).includes(locale)) return null;
  return { articleId: id.slice(0, cut), locale: locale as BatchLocale };
}

const MAX_ATTEMPTS = 3;

// 최근 일주일 동안 각 요청을 몇 번 보냈는지. 진행 중인 것은 기다리고, 세 번 실패한 것은 더 보내지 않는다
async function recentAttempts(): Promise<{ pending: Set<string>; tries: Map<string, number> }> {
  const since = new Date(Date.now() - 7 * 24 * 3600_000);
  const batches = await prisma.aiBatch.findMany({
    where: { kind: KIND, OR: [{ status: "in_progress" }, { createdAt: { gte: since } }] },
    select: { items: true, status: true },
  });
  const pending = new Set<string>();
  const tries = new Map<string, number>();
  for (const batch of batches) {
    for (const id of batch.items as string[]) {
      if (batch.status === "in_progress") pending.add(id);
      tries.set(id, (tries.get(id) ?? 0) + 1);
    }
  }
  return { pending, tries };
}

// 번역이 빠진 발행 글을 찾아 배치 하나로 보낸다.
export async function submitTranslations(limit = 200): Promise<number> {
  const { pending, tries } = await recentAttempts();
  const articles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      OR: BATCH_LOCALES.map((locale) => ({ translations: { none: { locale } } })),
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      id: true,
      translations: {
        select: { locale: true, title: true, seoTitle: true, summary: true, keyPoints: true, body: true, faq: true },
      },
    },
  });

  const requests: Anthropic.Messages.Batches.BatchCreateParams.Request[] = [];
  let worstCase = 0;
  for (const article of articles) {
    const en = article.translations.find((t) => t.locale === "en");
    if (!en) continue;
    const have = new Set(article.translations.map((t) => t.locale));
    const user = JSON.stringify({
      title: en.title,
      seoTitle: en.seoTitle,
      summary: en.summary,
      keyPoints: en.keyPoints,
      body: en.body,
      faq: en.faq,
    });
    for (const locale of BATCH_LOCALES) {
      const id = customId(article.id, locale);
      if (have.has(locale) || pending.has(id) || (tries.get(id) ?? 0) >= MAX_ATTEMPTS) continue;
      requests.push({
        custom_id: id,
        params: {
          model: MODELS.translate,
          max_tokens: MAX_TOKENS,
          system: TRANSLATE_SYSTEM,
          messages: [{ role: "user", content: `${TARGET[locale]}\n\n${user}` }],
          output_config: { effort: "low", format: { type: FORMAT.type, schema: FORMAT.schema } },
          ...thinkingFor(MODELS.translate),
        },
      });
      worstCase += worstCaseUsd(MODELS.translate, TRANSLATE_SYSTEM.length + user.length, MAX_TOKENS) * BATCH_DISCOUNT;
    }
  }

  if (requests.length === 0) {
    log.info("translate: nothing to submit");
    return 0;
  }
  await assertBudget(worstCase);
  const batch = await getClient().messages.batches.create({ requests });
  // 최악의 비용을 잡아 둔다. 거두기 전까지 예산 계산에 들어간다 (budget.ts)
  await prisma.aiBatch.create({
    data: { id: batch.id, kind: KIND, items: requests.map((r) => r.custom_id), reservedUsd: worstCase },
  });
  log.info("translate: batch submitted", { batchId: batch.id, requests: requests.length });
  return requests.length;
}

async function saveTranslation(articleId: string, locale: BatchLocale, message: Anthropic.Message): Promise<boolean> {
  if (message.stop_reason !== "end_turn") {
    log.warn("translate: incomplete result", { articleId, locale, stopReason: message.stop_reason });
    return false;
  }
  const text = message.content.find((block) => block.type === "text")?.text;
  if (!text) return false;
  let translated: Localized;
  try {
    translated = clean(FORMAT.parse(text));
  } catch (error) {
    log.warn("translate: invalid output", { articleId, locale, error: String(error) });
    return false;
  }
  // 다른 언어로 돌아온 결과(예: ru 자리에 한국어)는 버린다. 번역이 빈 채로 남아 다음 submit 때 다시 보내진다
  if (!looksLikeLocale(locale, `${translated.title}\n${translated.summary}\n${translated.body}`)) {
    log.warn("translate: wrong language", { articleId, locale, title: translated.title });
    return false;
  }
  // 슬러그는 영어판 것을 그대로 쓴다 (언어별로 유일하면 된다)
  const en = await prisma.translation.findUnique({
    where: { articleId_locale: { articleId, locale: "en" } },
    select: { slug: true },
  });
  if (!en) return false;
  const data = { ...translated, slug: en.slug };
  await prisma.translation.upsert({
    where: { articleId_locale: { articleId, locale } },
    create: { articleId, locale, ...data },
    update: data,
  });
  return true;
}

// 끝난 배치의 결과를 저장한다. 실패한 항목은 번역이 없는 채로 남으니 다음 submit 때 다시 보내진다.
// 번역 저장은 upsert 라 중간에 멈췄다 다시 돌려도 같다. 비용은 배치가 끝날 때 한 줄로 남기고 같은 트랜잭션에서
// "collected" 로 바꾼다 (다시 돌려도 비용이 두 번 쌓이지 않는다)
export async function collectTranslations(): Promise<number> {
  const batches = await prisma.aiBatch.findMany({ where: { kind: KIND, status: "in_progress" } });
  let saved = 0;
  for (const { id } of batches) {
    const batch = await getClient().messages.batches.retrieve(id);
    if (batch.processing_status !== "ended") continue;

    let usd = 0;
    let model: string = MODELS.translate;
    for await (const entry of await getClient().messages.batches.results(id)) {
      const target = parseCustomId(entry.custom_id);
      if (!target) continue;
      if (entry.result.type !== "succeeded") {
        log.warn("translate: request failed", { ...target, type: entry.result.type });
        continue;
      }
      const message = entry.result.message;
      model = message.model;
      usd += costUsd(message.model, message.usage) * BATCH_DISCOUNT;
      if (await saveTranslation(target.articleId, target.locale, message)) saved += 1;
    }
    if (!isKnownModel(model)) log.warn("cost: unknown model price, using fallback price", { model });
    await prisma.$transaction([
      prisma.costLog.create({ data: { kind: "LLM", amountUsd: usd, ref: `${KIND}-batch:${model}:${id}` } }),
      prisma.aiBatch.update({ where: { id }, data: { status: "collected", collectedAt: new Date() } }),
    ]);
    log.info("translate: batch collected", { batchId: id, usd: Number(usd.toFixed(4)), ...batch.request_counts });
  }
  return saved;
}
