import { isLocale } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/AppHeader";
import { Crumbs } from "@/components/beauty/Crumbs";
import { SkinQuiz } from "@/components/beauty/SkinQuiz";
import { Words } from "@/components/guide/Words";
import { JsonLd } from "@/components/JsonLd";
import type { QuizQuestion } from "@/components/quiz/Quiz";
import { beautyText } from "@/data/beauty";
import { SKIN_QUIZ } from "@/data/beauty/skin-type";
import { breadcrumbLd, graph } from "@/lib/jsonld-catalog";

import { absoluteUrl, beautyCrumbs, beautyMetadata, webPageLd } from "../meta";

// DB 를 읽지 않는 정적 화면 (9개 언어 모두 빌드 때 만든다 — 하위 동적 값이 없어 언어만 거를 수 없다)
export const revalidate = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/beauty/skin-type">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Beauty" });
  return beautyMetadata({
    locale,
    path: "/beauty/skin-type",
    title: t("quiz.metaTitle"),
    description: t("quiz.metaDescription"),
  });
}

// 피부 타입 테스트: 제목·소개 → 문항 6개를 한 화면에서 차례로 → '재미용' 고지 → 빵부스러기 (광고 없음).
// 고지·빵부스러기는 문항 아래에 둔다 — 위에 두면 아이폰 사파리 첫 화면(390×659)에서 마지막 보기가 탭바 밑으로 밀렸다.
// 문항 문구는 서버에서 줄바꿈 처리까지 해서 넘기고, 채점·저장·이동은 클라이언트 섬(SkinQuiz)이 한다
export default async function SkinTypeQuizPage({ params }: PageProps<"/[locale]/beauty/skin-type">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, tGuide, text] = await Promise.all([getTranslations("Beauty"), getTranslations("Guide"), beautyText(locale)]);
  const quiz = text.skinType;
  const questions: QuizQuestion[] = SKIN_QUIZ.flatMap((q) => {
    const copy = quiz.questions[q.id];
    if (!copy) return [];
    return [
      {
        id: q.id,
        q: <Words text={copy.q} locale={locale} />,
        options: q.options.map((o) => ({
          id: o.id,
          label: <Words text={copy.options[o.id] ?? o.id} locale={locale} />,
          weights: o.weights,
        })),
      },
    ];
  });
  const pageUrl = absoluteUrl(locale, "/beauty/skin-type");

  return (
    <>
      <AppHeader variant="pushed" parentHref="/beauty" title={quiz.title} />
      <JsonLd
        data={graph(
          webPageLd({ url: pageUrl, name: t("quiz.metaTitle"), description: t("quiz.metaDescription"), locale }),
          breadcrumbLd(beautyCrumbs(locale, tGuide("title"), t("title"), [{ name: quiz.title, url: pageUrl }])),
        )}
      />

      <div className="px-gutter pt-4">
        <h1 className="text-st2 font-bold text-ink-900">
          <Words text={quiz.title} locale={locale} />
        </h1>
        <p className="mt-1 text-t6 text-ink-600">
          <Words text={quiz.intro} locale={locale} />
        </p>
      </div>

      <SkinQuiz questions={questions} note={quiz.disclaimer} />

      {/* 빵부스러기는 테스트 아래에 (상단바 뒤로가 이미 /beauty 로 간다 — 위에 두면 첫 화면 마지막 보기가 탭바에 닿았다) */}
      <div className="pt-4">
        <Crumbs label={t("crumbsLabel")} items={[{ name: t("title"), href: "/beauty" }, { name: quiz.title }]} />
      </div>
    </>
  );
}
