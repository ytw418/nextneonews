import { getTranslations } from "next-intl/server";

import { ExternalIcon } from "@/components/icons";
import type { NetizenMix, NetizenView } from "@/lib/engagement";

// 반응 비율 색: 이벤트 틴트를 빌려 쓴다 (막대 옆에 %와 이름을 늘 함께 써서 색만으로 읽지 않는다)
const MIX: { key: keyof NetizenMix; label: "mixSupport" | "mixFunny" | "mixCritical" | "mixNeutral"; color: string }[] = [
  { key: "support", label: "mixSupport", color: "var(--tint-event-comeback)" },
  { key: "funny", label: "mixFunny", color: "var(--tint-event-awards)" },
  { key: "critical", label: "mixCritical", color: "var(--tint-event-drama)" },
  { key: "neutral", label: "mixNeutral", color: "var(--line-strong)" },
];

// theqoo.net → theqoo
function siteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^(www|m)\./, "").split(".")[0] ?? url;
  } catch {
    return url;
  }
}

// 한국 커뮤니티 반응 요약 카드. 글자로만 그린다 (원문 캡처·사진·닉네임 없음) — 검색·AI 가 인용할 수 있게.
// 원문은 링크로만 보내고 nofollow 를 단다
export async function NetizenCard({ netizen }: { netizen: NetizenView }) {
  const t = await getTranslations("Engage");
  const { mix } = netizen;

  return (
    <section aria-labelledby="netizen" className="mx-read mt-8 rounded-card bg-card p-5 shadow-card">
      <h2 id="netizen" className="text-t4 font-bold text-ink-900">
        {t("netizenTitle")}
      </h2>
      {netizen.commentCount > 0 && netizen.sampled > 0 && (
        <p className="mt-0.5 text-t7 tabular-nums text-ink-600">
          {t("netizenBasis", { total: netizen.commentCount, sampled: netizen.sampled })}
        </p>
      )}

      {mix && (
        <>
          <div aria-hidden className="mt-4 flex h-3 overflow-hidden rounded-full bg-fill-weak">
            {MIX.map(({ key, color }) =>
              mix[key] > 0 ? <span key={key} className="h-full" style={{ width: `${mix[key]}%`, backgroundColor: color }} /> : null,
            )}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-t7 text-ink-700">
            {MIX.map(({ key, label, color }) => (
              <li key={key} className="inline-flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                {t(label)}
                <span className="font-semibold tabular-nums text-ink-900">{mix[key]}%</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-4 text-t6 text-ink-700">{netizen.summary}</p>
      {netizen.quotes.map((quote) => (
        <blockquote
          key={quote}
          className="mt-3 rounded-card rounded-bl-badge bg-bg px-4 py-3 text-t6 text-ink-900"
        >
          {quote}
        </blockquote>
      ))}

      <a
        href={netizen.sourceUrl}
        target="_blank"
        rel="nofollow noopener"
        className="mt-3 inline-flex min-h-11 items-center gap-1 text-t6 font-semibold text-brand-ink"
      >
        {t("viewOriginal", { site: siteName(netizen.sourceUrl) })}
        <ExternalIcon className="size-4" />
      </a>
      <p className="text-st12 text-ink-600">{t("netizenNotice")}</p>
    </section>
  );
}
