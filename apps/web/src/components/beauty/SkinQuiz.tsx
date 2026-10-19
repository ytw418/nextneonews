"use client";

import { useTranslations } from "next-intl";

import { Quiz, type QuizQuestion } from "@/components/quiz/Quiz";
import { useRouter } from "@/i18n/navigation";
import { isSkinType, SKIN_TIE_ORDER } from "@/lib/beauty";

import { saveSkinType } from "./useSkinType";

// 피부 타입 테스트: 끝나면 이 기기에 타입을 남기고(평가 칩 facet·내 타입 집계) 결과 화면으로 간다
export function SkinQuiz({ questions }: { questions: QuizQuestion[] }) {
  const t = useTranslations("Beauty");
  const router = useRouter();
  return (
    <Quiz
      quiz="skin-type"
      questions={questions}
      order={SKIN_TIE_ORDER}
      backLabel={t("quiz.back")}
      progressLabel={(current, total) => t("quiz.progress", { current, total })}
      onDone={(result) => {
        if (!isSkinType(result)) return;
        saveSkinType(result);
        router.push(`/beauty/skin-type/${result}`);
      }}
    />
  );
}
