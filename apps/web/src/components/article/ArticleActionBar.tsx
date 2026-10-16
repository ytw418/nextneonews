"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { ArrowRightIcon, CommentIcon, LinkIcon } from "@/components/article/icons";
import { CURRENT_EVENT, type CurrentArticle } from "@/components/article/NextArticleLoader";
import { REACTION_EVENT } from "@/components/article/ReactionBar";
import { HeartIcon, ShareIcon } from "@/components/icons";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { toast } from "@/components/ui/Toast";
import { track } from "@/lib/track";

// LINE 이 주 메신저인 언어 (navigator.share 가 없을 때 바로 LINE 공유로)
const LINE_LOCALES = new Set(["ja", "zh-TW"]);
const ITEM = "press flex min-h-12 min-w-12 items-center justify-center gap-1 rounded-full px-3 text-t7 font-semibold";
const SHEET_ROW = "press-row flex min-h-14 w-full items-center gap-3 px-6 text-t5 font-medium text-ink-900";

function isTyping(el: Element | null): boolean {
  return el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && el.type !== "hidden");
}

function total(reactions: CurrentArticle["reactions"]): number {
  return Object.values(reactions).reduce((sum, n) => sum + n, 0);
}

interface Props {
  locale: string;
  article: CurrentArticle;
  upNextHref?: string; // 원래 글의 '다음 글' 주소 (UpNextCard 와 같은 글)
}

// 글 화면 하단 고정 캡슐 바: [댓글 n] [반응 n] [공유] [다음 →]. 탭바와 같은 모양·자리.
// 제목(h1)이 화면 위로 지나간 뒤에만 보이고, 댓글을 쓰는 동안에는 숨는다.
// 다음 글이 이어 붙어 지금 글이 바뀌면(hb:current-article) 그 글을 대상으로 바꾼다
export function ArticleActionBar({ locale, article: initial, upNextHref }: Props) {
  const t = useTranslations("Engage");
  const router = useRouter();
  const barRef = useRef<HTMLElement>(null);
  const [article, setArticle] = useState(initial);
  const [reactionCount, setReactionCount] = useState(() => total(initial.reactions));
  const [pastTitle, setPastTitle] = useState(false);
  const [typing, setTyping] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const shown = pastTitle && !typing;
  const isOriginal = article.id === initial.id;

  // h1 이 화면 위로 빠져나가면 보인다 (아래로 내려가 있을 때·화면 안에 있을 때는 숨김)
  useEffect(() => {
    const heading = document.querySelector("main h1");
    if (!heading) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setPastTitle(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(heading);
    return () => observer.disconnect();
  }, []);

  // 댓글 입력창에 초점이 있으면 숨긴다 (아이폰 키보드 위로 바가 뜨지 않게)
  useEffect(() => {
    const onFocus = () => setTyping(isTyping(document.activeElement));
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onFocus);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onFocus);
    };
  }, []);

  // 지금 읽는 글이 바뀌면 대상을 바꾸고, 반응을 누르면 숫자를 따라 올린다
  useEffect(() => {
    const onCurrent = (event: Event) => {
      const next = (event as CustomEvent<CurrentArticle>).detail;
      setArticle(next);
      setReactionCount(total(next.reactions));
    };
    window.addEventListener(CURRENT_EVENT, onCurrent);
    return () => window.removeEventListener(CURRENT_EVENT, onCurrent);
  }, []);

  useEffect(() => {
    const onReaction = (event: Event) => {
      const { articleId, delta } = (event as CustomEvent<{ articleId: string; delta: number }>).detail;
      if (articleId === article.id) setReactionCount((n) => Math.max(0, n + delta));
    };
    window.addEventListener(REACTION_EVENT, onReaction);
    return () => window.removeEventListener(REACTION_EVENT, onReaction);
  }, [article.id]);

  // 보이는 동안 바 높이를 --bottom-ui 로 알린다 (설치 안내·토스트가 바 위에 뜨고, 본문 끝이 가리지 않게)
  useEffect(() => {
    const bar = barRef.current;
    const root = document.documentElement;
    if (!shown || !bar) return;
    const measure = () =>
      root.style.setProperty("--bottom-ui", `calc(var(--tabbar-bottom) + ${Math.ceil(bar.getBoundingClientRect().height)}px)`);
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--bottom-ui");
    };
  }, [shown]);

  const scrollTo = (el: Element | null) => el?.scrollIntoView({ behavior: "smooth", block: "start" });

  const openComments = () => {
    if (isOriginal) scrollTo(document.getElementById("comments"));
    else router.push(`${article.url}#comments`);
  };

  const openReactions = () => scrollTo(document.querySelector(`[data-engage-for="${CSS.escape(article.id)}"]`));

  // 이어 붙인 다음 글이 있으면 그리로 내려가고, 없으면 다음 글 화면으로 간다
  const goNext = () => {
    const blocks = Array.from(document.querySelectorAll<HTMLElement>("[data-article-block]"));
    const index = blocks.findIndex((b) => b.dataset.articleBlock === article.id);
    const next = blocks[index + 1];
    if (next) scrollTo(next);
    else if (isOriginal && upNextHref) router.push(upNextHref);
    else scrollTo(document.getElementById("more-stories"));
  };

  const absoluteUrl = () => new URL(article.url, window.location.origin).href;

  const share = async () => {
    const url = absoluteUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, url });
        track("share", { method: "native" });
      } catch {
        // 공유 시트를 닫은 경우
      }
      return;
    }
    if (LINE_LOCALES.has(locale)) {
      track("share", { method: "line" });
      window.open(`https://line.me/R/share?text=${encodeURIComponent(`${article.title} ${url}`)}`, "_blank", "noopener");
      return;
    }
    setSheetOpen(true);
  };

  const shareX = () => {
    setSheetOpen(false);
    track("share", { method: "x" });
    const url = absoluteUrl();
    window.open(
      `https://x.com/intent/post?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener",
    );
  };

  const copyLink = async () => {
    setSheetOpen(false);
    track("share", { method: "copy" });
    try {
      await navigator.clipboard.writeText(absoluteUrl());
      toast(t("copied"));
    } catch {
      // 클립보드 권한이 없으면 조용히 둔다
    }
  };

  return (
    <>
      <nav
        ref={barRef}
        aria-label={t("barLabel")}
        inert={!shown}
        className={`fixed bottom-[var(--tabbar-bottom)] left-1/2 z-40 flex min-h-14 -translate-x-1/2 items-center gap-0.5 rounded-full bg-floating/97 p-1 shadow-float ring-1 ring-line backdrop-blur-xl backdrop-saturate-150 transition-[opacity,translate] duration-200 ease-expo ${
          shown ? "" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <button type="button" onClick={openComments} aria-label={t("barComments", { count: article.commentCount })} className={`${ITEM} text-ink-700`}>
          <CommentIcon className="size-5" />
          <span className="tabular-nums">{article.commentCount}</span>
        </button>
        <button type="button" onClick={openReactions} aria-label={t("barReactions", { count: reactionCount })} className={`${ITEM} text-ink-700`}>
          <HeartIcon className="size-5" />
          <span className="tabular-nums">{reactionCount}</span>
        </button>
        <button type="button" onClick={() => void share()} aria-label={t("barShare")} className={`${ITEM} text-ink-700`}>
          <ShareIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={goNext}
          className={`${ITEM} whitespace-nowrap bg-brand-weak text-brand-ink`}
        >
          {t("barNext")}
          <ArrowRightIcon className="size-4" />
        </button>
      </nav>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t("shareTitle")}>
        <button type="button" onClick={shareX} className={SHEET_ROW}>
          <ShareIcon className="size-5 text-ink-600" />
          {t("shareX")}
        </button>
        <button type="button" onClick={() => void copyLink()} className={SHEET_ROW}>
          <LinkIcon className="size-5 text-ink-600" />
          {t("copyLink")}
        </button>
      </BottomSheet>
    </>
  );
}
