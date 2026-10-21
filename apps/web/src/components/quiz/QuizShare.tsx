"use client";

import type { ReactNode } from "react";

import { ShareIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { type QuizShareCard, quizShareImage, useShareImage } from "@/lib/share-image";
import { track } from "@/lib/track";

// LINE 이 주 메신저인 언어: 시스템 공유 시트보다 LINE 공유(line.me/R/share)를 먼저 연다 (ArticleActionBar 와 같은 목록)
const LINE_LOCALES = new Set(["ja", "zh-TW"]);

interface Props {
  quiz: string;
  result: string;
  locale: string;
  text: string; // 공유 문장 ('나는 건성 피부! 너는?')
  label: string;
  copiedLabel: string;
  card?: QuizShareCard; // 결과 사진 카드 (스토리 크기). 사진 공유가 되는 기기에서만 쓴다
}

// 테스트 결과 공유 버튼 (결과 화면의 하나뿐인 채운 버튼). ja·zh-TW 는 LINE, 그 밖은 결과 사진 카드 → 아이폰 공유 시트 → 링크 복사
export function QuizShare({ quiz, result, locale, text, label, copiedLabel, card }: Props) {
  const cardFile = useShareImage(
    card ? `${quiz}:${result}:${locale}` : "",
    `unnienote-${quiz}-${result}.png`,
    card && (() => quizShareImage(card)),
  );

  async function share() {
    const url = window.location.href.split("#")[0]!;
    if (LINE_LOCALES.has(locale)) {
      track("quiz_share", { quiz, result, method: "line" });
      window.open(`https://line.me/R/share?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener");
      return;
    }
    const file = cardFile.current;
    if (file) {
      try {
        await navigator.share({ files: [file], text: `${text} ${url}` });
        track("quiz_share", { quiz, result, method: "image" });
      } catch {
        // 공유 시트를 닫은 경우
      }
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        track("quiz_share", { quiz, result, method: "native" });
      } catch {
        // 공유 시트를 닫은 경우
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      track("quiz_share", { quiz, result, method: "copy" });
      toast(copiedLabel);
    } catch {
      // 클립보드 권한이 없으면 조용히 둔다
    }
  }

  return (
    <Button size="l" variant="primary" onClick={() => void share()}>
      <ShareIcon className="size-5" />
      {label}
    </Button>
  );
}

// 상단바 공유(ShareButton)처럼 이미 있는 공유 버튼의 누름을 quiz_share 로도 센다
export function TrackQuizShare({ quiz, result, children }: { quiz: string; result: string; children: ReactNode }) {
  return <div onClickCapture={() => track("quiz_share", { quiz, result, method: "header" })}>{children}</div>;
}
