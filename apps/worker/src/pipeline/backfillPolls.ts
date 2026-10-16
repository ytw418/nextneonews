import { z } from "zod";

import type { Locale } from "@kmedia/core";
import { prisma } from "@kmedia/db";

import { BudgetExceededError } from "../ai/budget";
import { callStructured, RefusalError } from "../ai/client";
import { MODELS, worstCaseUsd } from "../ai/models";
import { POLL_SYSTEM } from "../ai/prompts";
import { log } from "../log";
import { alignPoll, cleanPoll, OPTION_IDS, PollText, shapePoll, simplifiedPoll } from "./localized";

// 최근 글 중 투표가 없는 글에 9개 언어 투표 문구를 붙인다. 글마다 Haiku 1회로 8개 언어를 받고 간체는 OpenCC 로 바꾼다.
// 호출마다 예산을 확인한다 (callStructured → assertBudget)

const PollDraft = z.object({
  poll: z
    .object({
      en: PollText,
      ja: PollText,
      zhTW: PollText,
      ko: PollText,
      vi: PollText,
      id: PollText,
      fr: PollText,
      ru: PollText,
    })
    .nullable(),
});
type PollDraft = z.infer<typeof PollDraft>;

const RECENT_DAYS = 14;
const MAX_TOKENS = 2000;
const EXPECTED_OUTPUT_TOKENS = 700; // 8개 언어 투표 한 벌 (실측 기준 대략값)
const KRW_PER_USD = 1500; // budget.ts 와 같은 보수적 환율

// 영어판에 맞춰 언어별 문구를 고른다. 보기 수가 다르면 영어 문구를 쓴다 (표는 하나로 합산된다)
function pollsByLocale(draft: NonNullable<PollDraft["poll"]>): { optionIds: string[]; polls: [Locale, PollText][] } | null {
  const en = cleanPoll(draft.en);
  if (!en) return null;
  const pick = (p: PollText, keepHangul = false) => alignPoll(en, keepHangul ? shapePoll(p) : cleanPoll(p)) ?? en;
  const zhTW = pick(draft.zhTW);
  return {
    optionIds: OPTION_IDS.slice(0, en.options.length),
    polls: [
      ["en", en],
      ["ja", pick(draft.ja)],
      ["zh-TW", zhTW],
      ["zh-CN", simplifiedPoll(zhTW) ?? zhTW],
      ["ko", pick(draft.ko, true)],
      ["vi", pick(draft.vi)],
      ["id", pick(draft.id)],
      ["fr", pick(draft.fr)],
      ["ru", pick(draft.ru)],
    ],
  };
}

export async function backfillPolls(limit: number): Promise<void> {
  const since = new Date(Date.now() - RECENT_DAYS * 24 * 3600_000);
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", riskTier: "GREEN", publishedAt: { gte: since }, poll: { is: null } },
    orderBy: { views: "desc" },
    take: limit,
    select: {
      id: true,
      category: true,
      translations: { where: { locale: "en" }, select: { title: true, summary: true, keyPoints: true } },
    },
  });
  const targets = articles.flatMap((a) => (a.translations[0] ? [{ ...a, en: a.translations[0] }] : []));
  if (targets.length === 0) {
    log.info("backfill-polls: nothing to do");
    return;
  }

  const requests = targets.map((a) => ({
    id: a.id,
    user: JSON.stringify({ category: a.category, title: a.en.title, summary: a.en.summary, keyPoints: a.en.keyPoints }),
  }));
  const estimateUsd = requests.reduce(
    (sum, r) => sum + worstCaseUsd(MODELS.translate, POLL_SYSTEM.length + r.user.length, EXPECTED_OUTPUT_TOKENS),
    0,
  );
  log.info("backfill-polls: estimate", {
    articles: requests.length,
    usd: Number(estimateUsd.toFixed(4)),
    krw: Math.ceil(estimateUsd * KRW_PER_USD),
  });

  let created = 0;
  let skipped = 0;
  for (const { id, user } of requests) {
    try {
      // 번역과 같은 Haiku. 짧은 문구라 effort low 로 충분하다
      const draft = await callStructured({
        task: "poll",
        model: MODELS.translate,
        system: POLL_SYSTEM,
        user,
        schema: PollDraft,
        effort: "low",
        maxTokens: MAX_TOKENS,
      });
      const result = draft.poll && pollsByLocale(draft.poll);
      if (!result) {
        skipped += 1;
        continue;
      }
      // 아직 없는 언어판(배치 번역 전)은 건너뛴다. 나중에 번역할 때 영어판 투표를 함께 옮긴다
      await prisma.$transaction([
        prisma.poll.create({ data: { kind: "article", articleId: id, optionIds: result.optionIds } }),
        ...result.polls.map(([locale, poll]) =>
          prisma.translation.updateMany({ where: { articleId: id, locale }, data: { poll } }),
        ),
      ]);
      created += 1;
    } catch (error) {
      if (error instanceof BudgetExceededError) throw error;
      skipped += 1;
      const level = error instanceof RefusalError ? "info" : "warn";
      log[level]("backfill-polls: failed", { articleId: id, error: String(error) });
    }
  }
  log.info("backfill-polls: done", { created, skipped });
}
