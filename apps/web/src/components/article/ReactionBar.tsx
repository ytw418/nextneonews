"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

import { ChevronRightIcon } from "@/components/icons";
import { toast } from "@/components/ui/Toast";
import type { ReactionType, Reactions } from "@/lib/engagement";
import { storageGet, storageSet } from "@/lib/storage";
import { track } from "@/lib/track";

// 버튼 순서·이모지. '화나요'는 두지 않는다 (lib/engagement.ts REACTION_TYPES 와 같은 네 가지)
const REACTIONS: { type: ReactionType; emoji: string; label: "reactLove" | "reactWow" | "reactMore" | "reactSad" }[] = [
  { type: "love", emoji: "💖", label: "reactLove" },
  { type: "wow", emoji: "😮", label: "reactWow" },
  { type: "more", emoji: "🙋", label: "reactMore" },
  { type: "sad", emoji: "😢", label: "reactSad" },
];

// 하단 바(ArticleActionBar)가 숫자를 따라 올리도록 알린다
export const REACTION_EVENT = "hb:reaction";

const noSubscribe = () => () => {};

function parsePressed(raw: string | null): ReactionType[] {
  if (!raw) return [];
  try {
    const list: unknown = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((t): t is ReactionType => REACTIONS.some((r) => r.type === t)) : [];
  } catch {
    return [];
  }
}

interface Props {
  articleId: string;
  reactions: Reactions;
  anchorId?: string; // 글 페이지는 'reactions', 이어 붙인 글은 'reactions-{id}'
  commentHref: string; // '한마디 남기기' 가 가는 곳 (#comments 또는 원래 글 주소#comments)
}

// 로그인 없는 반응 버튼 4개. 숫자는 서버 HTML 에 그대로 있다 (검색·AI 가 읽는다).
// 누른 종류는 이 기기에 기억하고(hb:react:{id}) 다시 세지 않는다
export function ReactionBar({ articleId, reactions, anchorId, commentHref }: Props) {
  const t = useTranslations("Engage");
  const tComments = useTranslations("Comments");
  const key = `hb:react:${articleId}`;
  // 하이드레이션 뒤에 저장소 값을 읽는다 (서버 HTML 은 아무것도 누르지 않은 모양)
  const stored = useSyncExternalStore(noSubscribe, () => storageGet(key), () => null);
  const [mine, setMine] = useState<ReactionType[]>([]);
  const [counts, setCounts] = useState(reactions);
  const pressed = new Set([...parsePressed(stored), ...mine]);

  const react = async (type: ReactionType) => {
    if (pressed.has(type)) return;
    const next = [...pressed, type];
    setMine(next);
    setCounts((c) => ({ ...c, [type]: c[type] + 1 }));
    storageSet(key, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(REACTION_EVENT, { detail: { articleId, delta: 1 } }));
    track("reaction", { type });
    try {
      const res = await fetch(`/api/reactions/${articleId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { reactions?: Reactions };
      if (data.reactions) setCounts(data.reactions);
    } catch {
      // 못 보냈으면 누르기 전으로 되돌린다
      setMine((list) => list.filter((x) => x !== type));
      setCounts((c) => ({ ...c, [type]: Math.max(0, c[type] - 1) }));
      storageSet(key, JSON.stringify([...pressed]));
      window.dispatchEvent(new CustomEvent(REACTION_EVENT, { detail: { articleId, delta: -1 } }));
      toast(tComments("failed"));
    }
  };

  const titleId = `${anchorId ?? `reactions-${articleId}`}-title`;

  return (
    <section
      id={anchorId}
      data-engage-for={articleId}
      aria-labelledby={titleId}
      className="mx-read mt-8 scroll-mt-20"
    >
      <h2 id={titleId} className="text-t5 font-bold text-ink-900">
        {t("reactionsTitle")}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {REACTIONS.map(({ type, emoji, label }) => {
          const on = pressed.has(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={on}
              onClick={() => void react(type)}
              className={`press inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-t6 font-semibold ring-1 ${
                on ? "bg-brand-weak text-brand-ink ring-brand" : "bg-card text-ink-700 ring-line"
              }`}
            >
              <span aria-hidden>{emoji}</span>
              {t(label)}
              {counts[type] > 0 && <span className="tabular-nums text-ink-600">{counts[type]}</span>}
            </button>
          );
        })}
      </div>
      {pressed.size > 0 && (
        <a
          href={commentHref}
          className="mt-3 inline-flex min-h-11 items-center gap-0.5 text-t6 font-semibold text-brand-ink"
        >
          {t("leaveComment")}
          <ChevronRightIcon className="size-4" />
        </a>
      )}
    </section>
  );
}
