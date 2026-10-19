"use client";

import { useTranslations } from "next-intl";
import type { MouseEvent } from "react";

import { HeartFilledIcon, HeartIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { toast } from "@/components/ui/Toast";
import { useRouter } from "@/i18n/navigation";
import { type SavedKind, toggleSaved, useIsSaved } from "@/lib/saved";
import { track } from "@/lib/track";

// 토스트 한 줄에 들어가게 제목을 줄인다
const TITLE_MAX = 32;

function short(title: string): string {
  const chars = Array.from(title.trim());
  return chars.length > TITLE_MAX ? `${chars.slice(0, TITLE_MAX - 1).join("")}…` : title.trim();
}

interface Props {
  kind: SavedKind;
  id: string;
  title: string; // 토스트·버튼 이름에 넣는 항목 이름
  // icon: 상단바 action·카드 모서리 (44px) / chip: 본문 버튼 (Button size m weak)
  variant?: "icon" | "chip";
  tone?: "ink" | "inverse"; // icon 만. inverse: 어두운 면·사진 위
  className?: string;
}

// 로그인 없는 저장(하트). 이 기기에만 남고(lib/saved.ts) 저장함(/saved)에 모인다.
// 서버 렌더·첫 하이드레이션에는 빈 하트(저장 여부는 이 기기만 안다). 저장할 때만 토스트로 저장함 가는 길을 알려 준다
export function SaveButton({ kind, id, title, variant = "icon", tone = "ink", className = "" }: Props) {
  const t = useTranslations("Engage");
  const router = useRouter();
  const saved = useIsSaved(kind, id);

  const toggle = (event: MouseEvent<HTMLElement>) => {
    // 카드 링크 위에 얹혀도 카드가 열리지 않게
    event.preventDefault();
    event.stopPropagation();
    const now = toggleSaved(kind, id);
    track(now ? "save" : "unsave", { kind, id });
    if (now) {
      toast(t("savedToast", { title: short(title) }), {
        actionLabel: t("savedOpen"),
        onAction: () => router.push("/saved"),
      });
    }
  };

  if (variant === "chip") {
    return (
      <Button size="m" variant="weak" aria-pressed={saved} onClick={toggle} className={className}>
        {saved ? <HeartFilledIcon className="size-4" /> : <HeartIcon className="size-4" />}
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
      {saved ? <HeartFilledIcon className={tone === "ink" ? "text-brand" : undefined} /> : <HeartIcon />}
    </IconButton>
  );
}
