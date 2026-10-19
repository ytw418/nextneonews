"use client";

import { useLocale, useTranslations } from "next-intl";
import { type MouseEvent, useState } from "react";

import { BookmarkFilledIcon, BookmarkIcon } from "@/components/icons";
import { sendSavedList } from "@/components/saved/sendList";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { toast } from "@/components/ui/Toast";
import { useRouter } from "@/i18n/navigation";
import { readSaved, type SavedKind, toggleSaved, useIsSaved } from "@/lib/saved";
import { track } from "@/lib/track";

// 토스트 한 줄에 들어가게 제목을 줄인다
const TITLE_MAX = 32;
// 첫 저장 토스트는 읽을 게 더 많아서 조금 오래 둔다 (기본: 버튼이 있으면 5초)
const FIRST_TOAST_MS = 8000;

function short(title: string): string {
  const chars = Array.from(title.trim());
  return chars.length > TITLE_MAX ? `${chars.slice(0, TITLE_MAX - 1).join("")}…` : title.trim();
}

interface Props {
  kind: SavedKind;
  id: string;
  title: string; // 토스트·버튼 이름에 넣는 항목 이름
  // icon: 상단바 action·카드 모서리 (44px) / chip: 본문 버튼 (Button size m)
  variant?: "icon" | "chip";
  tone?: "ink" | "inverse"; // icon 만. inverse: 어두운 면·사진 위
  className?: string; // 커버 위에 얹을 때 받침: "bg-tape backdrop-blur-sm"
}

// 로그인 없는 저장(북마크 — 하트는 글 반응 전용이다). 이 기기에만 남고(lib/saved.ts) 저장함(/saved)에 모인다.
// 서버 렌더·첫 하이드레이션에는 빈 북마크(저장 여부는 이 기기만 안다). 저장하면 아이콘이 한 번 튀고(heart-pop) 토스트가 뜬다:
// 처음 저장(목록이 비어 있었음)이면 '이 브라우저에만 남아요 — 나에게 보내기', 그 뒤로는 '저장했어요 — 보기'. 해제는 토스트 없음
export function SaveButton({ kind, id, title, variant = "icon", tone = "ink", className = "" }: Props) {
  const t = useTranslations("Engage");
  const locale = useLocale();
  const router = useRouter();
  const saved = useIsSaved(kind, id);
  // 이 화면에서 저장할 때마다 1씩 늘려 아이콘 key 를 바꾼다 (팝을 다시 튼다). 0 이면 처음부터 저장돼 있던 것이라 튀지 않는다
  const [pops, setPops] = useState(0);

  const toggle = (event: MouseEvent<HTMLElement>) => {
    // 카드 링크 위에 얹혀도 카드가 열리지 않게
    event.preventDefault();
    event.stopPropagation();
    const first = readSaved().length === 0;
    const now = toggleSaved(kind, id);
    track(now ? "save" : "unsave", { kind, id });
    if (!now) return;
    setPops((n) => n + 1);
    if (first) {
      toast(t("savedFirstToast"), {
        // ja·zh-TW 는 'LINE で送る', 그 밖은 '링크 복사' (언어마다 보내는 방법이 정해져 있어 문구 하나로 둔다)
        actionLabel: t("sendToSelfAction"),
        onAction: () =>
          void sendSavedList({ locale, text: t("sendToSelfText"), copied: t("sendToSelfCopied"), from: "toast" }),
        duration: FIRST_TOAST_MS,
      });
      return;
    }
    toast(t("savedToast", { title: short(title) }), {
      actionLabel: t("savedOpen"),
      onAction: () => router.push("/saved"),
    });
  };

  const icon = saved ? (
    <BookmarkFilledIcon
      key={pops}
      className={`${tone === "ink" ? "text-brand" : ""} ${pops > 0 ? "animate-heart-pop" : ""}`}
    />
  ) : (
    <BookmarkIcon />
  );

  if (variant === "chip") {
    // 이름은 그대로 두고 상태는 aria-pressed 로만 알린다 ('저장됨, 눌림'처럼 두 번 말하지 않게)
    return (
      <Button
        size="m"
        variant={saved ? "neutral" : "weak"}
        aria-label={t("saveItem", { title: short(title) })}
        aria-pressed={saved}
        onClick={toggle}
        className={`[&_svg]:size-4 ${className}`}
      >
        {icon}
        {saved ? t("savedState") : t("save")}
      </Button>
    );
  }

  return (
    <IconButton
      label={t("saveItem", { title: short(title) })}
      aria-pressed={saved}
      tone={tone}
      onClick={toggle}
      className={className}
    >
      {icon}
    </IconButton>
  );
}
