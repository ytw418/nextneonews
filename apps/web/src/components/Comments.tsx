"use client";

import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";

import type { PublicComment } from "@/lib/comments";
import { timeAgo } from "@/lib/time";

type Mode = { id: string; kind: "edit" | "delete"; body: string; password: string } | null;

const BODY_MAX = 1000;
const NICKNAME_KEY = "hb:comment-nickname";

// 같은 글 안의 같은 사람은 같은 색 점 (IP 해시 4자리에서 색을 뽑는다)
function dotColor(idHash: string): string {
  return `hsl(${parseInt(idHash, 16) % 360} 85% 68%)`;
}

const inputClass =
  "h-11 min-w-0 rounded-[12px] bg-bg px-3 text-[15px] outline-none ring-1 ring-line placeholder:text-muted focus:ring-2 focus:ring-cherry";

export function Comments({ articleId }: { articleId: string }) {
  const t = useTranslations("Comments");
  const locale = useLocale();
  const [comments, setComments] = useState<PublicComment[] | null>(null);
  const [body, setBody] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [reported, setReported] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/comments?articleId=${encodeURIComponent(articleId)}`)
      .then((res) => (res.ok ? res.json() : { comments: [] }))
      .then((data: { comments: PublicComment[] }) => {
        if (alive) setComments(data.comments);
      })
      .catch(() => alive && setComments([]));
    const saved = localStorage.getItem(NICKNAME_KEY);
    if (saved) queueMicrotask(() => alive && setNickname(saved));
    return () => {
      alive = false;
    };
  }, [articleId]);

  // 서버 오류 코드 → 사용자 문구
  const errorText = (code: string | undefined) => {
    switch (code) {
      case "links":
        return t("noLinks");
      case "tooFast":
        return t("tooFast");
      case "wrongPassword":
        return t("wrongPassword");
      default:
        return t("error");
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const website = (new FormData(event.currentTarget as HTMLFormElement).get("website") as string) || undefined;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ articleId, locale, nickname: nickname || undefined, password, body, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(errorText(data.error));
        return;
      }
      setComments((list) => [...(list ?? []), data.comment]);
      setBody("");
      setPassword("");
      if (nickname) localStorage.setItem(NICKNAME_KEY, nickname);
    } finally {
      setBusy(false);
    }
  };

  const confirmAction = async () => {
    if (!mode) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/comments/${mode.id}`, {
        method: mode.kind === "edit" ? "PATCH" : "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mode.kind === "edit" ? { password: mode.password, body: mode.body } : { password: mode.password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(errorText(data.error));
        return;
      }
      if (mode.kind === "edit") {
        const data = (await res.json()) as { comment: PublicComment };
        setComments((list) => (list ?? []).map((c) => (c.id === mode.id ? data.comment : c)));
      } else {
        setComments((list) => (list ?? []).filter((c) => c.id !== mode.id));
      }
      setMode(null);
    } finally {
      setBusy(false);
    }
  };

  const report = async (id: string) => {
    await fetch(`/api/comments/${id}/report`, { method: "POST" }).catch(() => undefined);
    setReported(id);
  };

  const count = comments?.length ?? 0;

  return (
    <section id="comments" className="mt-10 scroll-mt-20">
      <div className="flex items-baseline gap-2">
        <h2 className="font-display text-[24px] italic">{t("title")}</h2>
        {count > 0 && (
          <span className="rounded-full bg-cherry px-2 py-0.5 font-label text-[12px] font-bold text-white">{count}</span>
        )}
      </div>

      <form onSubmit={submit} className="mt-3 rounded-[18px] bg-card p-3 shadow-[inset_0_0_0_1px_var(--line)]">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={BODY_MAX}
          required
          rows={3}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="w-full resize-none rounded-[12px] bg-bg px-3 py-2.5 text-[15.5px] leading-relaxed outline-none ring-1 ring-line placeholder:text-muted focus:ring-2 focus:ring-cherry"
        />
        {/* 봇만 채우는 칸 */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={12}
            placeholder={t("nickname")}
            aria-label={t("nickname")}
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={4}
            required
            autoComplete="new-password"
            placeholder={t("password")}
            aria-label={t("password")}
            className={inputClass}
          />
        </div>
        <div className="mt-2 flex items-start gap-3">
          <p className="flex-1 px-1 text-[12px] leading-relaxed text-muted">{t("rules")}</p>
          <button
            type="submit"
            disabled={busy || body.trim().length === 0}
            className="h-10 shrink-0 rounded-full bg-cherry px-5 font-label text-[14px] font-bold text-white disabled:opacity-40"
          >
            {t("submit")}
          </button>
        </div>
        {error && !mode && (
          <p role="alert" className="mt-1 px-1 text-[13px] font-semibold text-cherry-deep">
            {error}
          </p>
        )}
      </form>

      {comments !== null && count === 0 && <p className="mt-4 px-1 text-[14px] text-muted">{t("empty")}</p>}

      <ul className="mt-4 space-y-3">
        {(comments ?? []).map((c) => {
          const active = mode?.id === c.id ? mode : null;
          return (
            <li key={c.id} className="rounded-[18px_18px_18px_6px] bg-card px-4 py-3 shadow-[0_1px_0_var(--line)]">
              <div className="flex items-center gap-1.5 text-[12.5px] text-muted">
                <span className="size-2 rounded-full" style={{ backgroundColor: dotColor(c.idHash) }} />
                <span className="font-label font-bold text-fg">{c.nickname}</span>
                {c.locale !== locale && (
                  <span className="rounded-full bg-bg px-1.5 font-label text-[10.5px] uppercase ring-1 ring-line">
                    {c.locale}
                  </span>
                )}
                <span aria-hidden>·</span>
                <time dateTime={c.createdAt}>{timeAgo(new Date(c.createdAt), locale)}</time>
                {c.edited && <span>· {t("edited")}</span>}
              </div>

              {active?.kind === "edit" ? (
                <textarea
                  value={active.body}
                  onChange={(e) => setMode({ ...active, body: e.target.value })}
                  maxLength={BODY_MAX}
                  rows={3}
                  aria-label={t("edit")}
                  className="mt-2 w-full resize-none rounded-[12px] bg-bg px-3 py-2 text-[15px] outline-none ring-1 ring-line focus:ring-2 focus:ring-cherry"
                />
              ) : (
                <p className="mt-1.5 whitespace-pre-wrap break-words text-[15.5px] leading-[1.65]">{c.body}</p>
              )}

              {active ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="password"
                    value={active.password}
                    onChange={(e) => setMode({ ...active, password: e.target.value })}
                    placeholder={t("password")}
                    aria-label={t("password")}
                    autoFocus
                    className={`${inputClass} h-9 w-[7.5rem] text-[14px]`}
                  />
                  <button
                    type="button"
                    onClick={confirmAction}
                    disabled={busy || !active.password}
                    className="h-9 rounded-full bg-fg px-3.5 text-[13px] font-bold text-bg disabled:opacity-40"
                  >
                    {active.kind === "edit" ? t("save") : t("delete")}
                  </button>
                  <button type="button" onClick={() => setMode(null)} className="h-9 px-2 text-[13px] text-muted">
                    {t("cancel")}
                  </button>
                  {error && (
                    <p role="alert" className="w-full text-[13px] font-semibold text-cherry-deep">
                      {error}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-1.5 flex justify-end gap-3 text-[12px] text-muted">
                  <button type="button" onClick={() => { setError(null); setMode({ id: c.id, kind: "edit", body: c.body, password: "" }); }}>
                    {t("edit")}
                  </button>
                  <button type="button" onClick={() => { setError(null); setMode({ id: c.id, kind: "delete", body: c.body, password: "" }); }}>
                    {t("delete")}
                  </button>
                  {reported === c.id ? (
                    <span>{t("reported")}</span>
                  ) : (
                    <button type="button" onClick={() => report(c.id)}>
                      {t("report")}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
