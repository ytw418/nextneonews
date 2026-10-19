"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { scoreQuiz } from "@/lib/beauty";
import { track } from "@/lib/track";

// 고른 보기를 잠깐 칠해 보여 준 뒤 다음 문항으로 (눌렀다는 확인)
const ADVANCE_MS = 150;

export interface QuizQuestion {
  id: string;
  q: ReactNode; // 서버에서 줄바꿈 처리(Words)까지 해서 넘긴다
  options: { id: string; label: ReactNode; weights: Partial<Record<string, number>> }[];
}

interface Props {
  quiz: string; // 분석 이벤트 이름표 (skin-type)
  questions: QuizQuestion[];
  order: readonly string[]; // 결과 후보. 점수가 같으면 앞쪽
  backLabel: string; // 이전 문항 (상단바 '뒤로'와 이름이 겹치지 않게)
  note?: string; // 보기 아래 작은 고지 (재미용·진단 아님)
  progressLabel: (current: number, total: number) => string;
  onDone: (result: string) => void;
}

// 한 화면에서 문항을 하나씩 바꿔 보이는 테스트 엔진: 위에 진행 점, 가운데 질문, 아래 보기 버튼 세로 줄, 이전 문항.
// 문항이 바뀌면 테스트 머리를 화면 위로 올려(상단바 아래) 보기가 떠 있는 탭바에 가리지 않게 하고, 질문으로 초점을 옮겨
// 화면 읽기·키보드가 처음부터 다시 읽는다. 아래 여백은 탭바 높이만큼 둔다. 광고는 넣지 않는다 (문항 사이 광고 금지)
export function Quiz({ quiz, questions, order, backLabel, note, progressLabel, onDone }: Props) {
  const headingId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const started = useRef(false);
  const moved = useRef(false); // 첫 문항은 초점을 옮기지 않는다 (페이지 첫 진입)
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!moved.current) return;
    sectionRef.current?.scrollIntoView({ block: "start" }); // html 의 scroll-padding-top 이 상단바 높이를 비운다
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const question = questions[step];
  if (!question) return null;
  const total = questions.length;

  function choose(optionId: string) {
    if (picked || done || !question) return;
    if (!started.current) {
      started.current = true;
      track("quiz_start", { quiz });
    }
    const next = { ...answers, [question.id]: optionId };
    setAnswers(next);
    setPicked(optionId);
    timer.current = window.setTimeout(() => {
      if (step + 1 < total) {
        setPicked(null);
        moved.current = true;
        setStep(step + 1);
        return;
      }
      const result = scoreQuiz(questions, next, order);
      setDone(true);
      track("quiz_complete", { quiz, result });
      onDone(result);
    }, ADVANCE_MS);
  }

  function back() {
    if (picked || step === 0) return;
    moved.current = true;
    setStep(step - 1);
  }

  const chosen = picked ?? answers[question.id];

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      aria-busy={done || undefined}
      className="min-h-[calc(100svh-var(--bottom-ui))] px-gutter pt-4"
    >
      <div className="flex items-center justify-between gap-3">
        <ol aria-hidden className="flex gap-1.5">
          {questions.map((q, i) => (
            <li
              key={q.id}
              className={`h-1.5 w-6 rounded-full ${i < step ? "bg-brand" : i === step ? "bg-ink-600" : "bg-line-strong"}`}
            />
          ))}
        </ol>
        <p aria-live="polite" className="text-st12 font-semibold tabular-nums text-ink-600">
          {progressLabel(step + 1, total)}
        </p>
      </div>

      <div key={question.id} className="animate-fade-in">
        <h2 ref={headingRef} id={headingId} tabIndex={-1} className="mt-4 text-t3 font-bold text-ink-900">
          {question.q}
        </h2>
        <div role="group" aria-labelledby={headingId} className="mt-4 flex flex-col gap-2">
          {question.options.map((o) => (
            <Button
              key={o.id}
              size="xl"
              variant={chosen === o.id ? "weak" : "neutral"}
              block
              aria-pressed={chosen === o.id}
              onClick={() => choose(o.id)}
            >
              {o.label}
            </Button>
          ))}
        </div>
      </div>

      {step > 0 && (
        <Button size="m" variant="neutral" className="mt-5" onClick={back}>
          {backLabel}
        </Button>
      )}
      {note && <p className="mt-4 text-st12 text-ink-600">{note}</p>}
    </section>
  );
}
