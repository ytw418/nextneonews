import { getTranslations } from "next-intl/server";

import { AWARDS_MIN_VOTES, VOTE_DAMPING, VOTE_WEIGHT } from "@/lib/beauty";

// 순위 산식 공개 (어워드·허브 하단). 식의 숫자는 lib/beauty.ts 상수에서 그대로 가져온다 — 문구와 계산이 어긋나지 않게
export async function MethodNote({ locale, id = "beauty-method" }: { locale: string; id?: string }) {
  const t = await getTranslations({ locale, namespace: "Beauty" });
  return (
    <section aria-labelledby={id} className="px-gutter pt-6">
      <h2 id={id} className="text-t4 font-bold text-ink-900">
        {t("method.title")}
      </h2>
      <p className="mt-2 rounded-card bg-card px-4 py-3 text-t6 font-semibold tabular-nums text-ink-900 shadow-card">
        {t("method.formula", { weight: VOTE_WEIGHT, damping: VOTE_DAMPING })}
      </p>
      <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-t6 text-ink-700 marker:text-ink-400">
        <li>{t("method.votes")}</li>
        <li>{t("method.editors", { count: AWARDS_MIN_VOTES })}</li>
        <li>{t("method.independent")}</li>
        <li>{t("priceLegend")}</li>
      </ul>
    </section>
  );
}
