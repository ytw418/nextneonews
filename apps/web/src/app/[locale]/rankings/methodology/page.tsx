import { isLocale } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/AppHeader";
import { localeAlternates, localeHomePath, ogBase } from "@/lib/url";

// 글자만 있는 안내라 시간이 지나도 다시 만들지 않는다 (머리말 카테고리가 바뀌면 공유 캐시 태그로 함께 비워진다)
export const revalidate = false;

// 식은 언어와 상관없이 그대로 보인다 (worker/rankings/score.ts 의 v1 과 같다)
const FORMULA = {
  kr: "KR = 0.4·L(theqoo views) + 0.2·L(theqoo comments) + 0.2·L(Google Trends) + 0.2·L(Yonhap)",
  gl: "GL = avg(L(Wikipedia views): ko, en, ja, zh, vi, id, fr, ru)",
  score: "Score = 0.5·KR + 0.5·GL",
  log: "L(x) = log₁₀(1 + x)",
};

const SOURCES = [
  { key: "theqoo", url: "https://theqoo.net/hot" },
  { key: "trends", url: "https://trends.google.com/trending?geo=KR" },
  { key: "yonhap", url: "https://www.yna.co.kr" },
  { key: "wiki", url: "https://wikimedia.org/api/rest_v1/" },
  { key: "wikidata", url: "https://www.wikidata.org" },
  { key: "commons", url: "https://commons.wikimedia.org" },
] as const;

const UNUSED = ["youtube", "nate", "melon"] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/rankings/methodology">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Rankings" });
  const alternates = localeAlternates(locale, "/rankings/methodology");
  return {
    title: t("method.title"),
    description: t("method.metaDescription"),
    alternates,
    openGraph: {
      ...ogBase(locale),
      type: "article",
      url: alternates.canonical,
      title: t("method.title"),
      description: t("method.metaDescription"),
      images: [`${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="px-gutter pt-8">
      <h2 id={id} className="text-t4 font-bold text-ink-900">
        {title}
      </h2>
      <div className="mt-2 flex flex-col gap-3 text-t6 text-ink-700">{children}</div>
    </section>
  );
}

const CODE = "block rounded-btn-m bg-fill-weak px-3 py-2 text-st12 break-words text-ink-900";
const LINK = "font-semibold text-brand-ink underline-offset-2 hover:underline";

// 계산 방법: 축과 가중치, 진입 조건, 출처와 라이선스, 쓰지 않는 소스와 이유, 변경 기록
export default async function MethodologyPage({ params }: PageProps<"/[locale]/rankings/methodology">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Rankings");

  return (
    <>
      <AppHeader variant="pushed" parentHref="/rankings" title={t("method.title")} />
      <div className="px-gutter pt-6">
        <h1 className="text-st2 font-bold text-ink-900">{t("method.title")}</h1>
        <p className="mt-2 text-t5 text-ink-700">{t("method.intro")}</p>
      </div>

      <Section id="m-axes" title={t("method.axesTitle")}>
        <p>{t("method.kr")}</p>
        <code className={CODE}>{FORMULA.kr}</code>
        <p>{t("method.gl")}</p>
        <code className={CODE}>{FORMULA.gl}</code>
        <p>{t("method.score")}</p>
        <code className={CODE}>{FORMULA.score}</code>
        <p>{t("method.normalize")}</p>
        <code className={CODE}>{FORMULA.log}</code>
      </Section>

      <Section id="m-entry" title={t("method.entryTitle")}>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>{t("method.types")}</li>
          <li>{t("method.entry")}</li>
          <li>{t("method.rising")}</li>
          <li>{t("method.local")}</li>
          <li>{t("method.fans")}</li>
        </ul>
      </Section>

      <Section id="m-sources" title={t("method.sourcesTitle")}>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          {SOURCES.map((s) => (
            <li key={s.key}>
              <a href={s.url} target="_blank" rel="noopener" className={LINK}>
                {t(`method.source.${s.key}.name`)}
              </a>
              {" — "}
              {t(`method.source.${s.key}.note`)}
            </li>
          ))}
        </ul>
        <p>
          {t("method.license")}{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener license" className={LINK}>
            CC BY 4.0
          </a>
        </p>
      </Section>

      <Section id="m-unused" title={t("method.unusedTitle")}>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          {UNUSED.map((key) => (
            <li key={key}>{t(`method.unused.${key}`)}</li>
          ))}
        </ul>
      </Section>

      <Section id="m-log" title={t("method.changelogTitle")}>
        <ul className="flex flex-col gap-1">
          <li>
            <time dateTime="2026-10-17" className="font-semibold tabular-nums text-ink-900">
              v1 · 2026-10-17
            </time>
            {" — "}
            {t("method.v1")}
          </li>
        </ul>
      </Section>
    </>
  );
}
