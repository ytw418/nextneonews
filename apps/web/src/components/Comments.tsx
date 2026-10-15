"use client";

import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { PublicComment } from "@/lib/comments";
import { storageGet, storageSet } from "@/lib/storage";
import { timeAgo } from "@/lib/time";

type Mode = { id: string; kind: "edit" | "delete"; body: string; password: string } | null;

const BODY_MAX = 1000;
const NICKNAME_KEY = "hb:comment-nickname";

// 같은 글 안의 같은 사람은 같은 색 점 (IP 해시에서 아바타 틴트 6개 중 하나를 고른다)
function avatarTint(idHash: string): string {
  return `var(--avatar-${(parseInt(idHash.slice(0, 8), 16) % 6) + 1})`;
}

const fieldClass =
  "rounded-btn bg-bg text-ink-900 outline-none ring-1 ring-line-strong placeholder:text-ink-600 focus:ring-2 focus:ring-brand";
const inputClass = `min-h-11 min-w-0 px-3 text-t6 ${fieldClass}`;

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
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch(`/api/comments?articleId=${encodeURIComponent(articleId)}`)
      .then((res) => (res.ok ? res.json() : { comments: [], total: 0 }))
      .then((data: { comments: PublicComment[]; total: number }) => {
        if (!alive) return;
        setComments(data.comments);
        setTotal(data.total);
      })
      .catch(() => alive && setComments([]));
    const saved = storageGet(NICKNAME_KEY);
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
      case "locked":
        return t("locked");
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
      setTotal((n) => n + 1);
      if (nickname) storageSet(NICKNAME_KEY, nickname);
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
        setTotal((n) => Math.max(0, n - 1));
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

  const count = Math.max(total, comments?.length ?? 0);

  return (
    <section id="comments" aria-labelledby="comments-title" className="scroll-mt-20">
      <SectionHeader id="comments-title" inset="read" title={t("title")} count={count} />

      <form onSubmit={submit} className="mx-read rounded-card bg-card p-3 ring-1 ring-line ring-inset">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={BODY_MAX}
          required
          rows={3}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className={`w-full resize-none px-3 py-2.5 text-t5 ${fieldClass}`}
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
        <div className="mt-2 flex flex-wrap items-start justify-end gap-3">
          <p className="min-w-[12rem] flex-1 px-1 text-t7 text-ink-600">{t("rules")}</p>
          <Button type="submit" size="m" loading={busy} disabled={!busy && body.trim().length === 0}>
            {t("submit")}
          </Button>
        </div>
        {error && !mode && (
          <p role="alert" className="mt-1 px-1 text-t6 font-semibold text-danger">
            {error}
          </p>
        )}
      </form>

      {comments !== null && count === 0 && <p className="mt-4 px-read text-t6 text-ink-600">{t("empty")}</p>}

      <ul className="mt-4 space-y-3 px-read">
        {(comments ?? []).map((c) => {
          const active = mode?.id === c.id ? mode : null;
          return (
            <li key={c.id} className="rounded-card rounded-bl-md bg-card px-4 py-3 shadow-card">
              <div className="flex flex-wrap items-center gap-1.5 text-t7 text-ink-600">
                <span className="size-2 rounded-full" style={{ backgroundColor: avatarTint(c.idHash) }} />
                <span className="font-semibold text-ink-900">{c.nickname}</span>
                {c.locale !== locale && (
                  <span className="rounded-badge bg-fill-weak px-1.5 text-st12 uppercase text-ink-700">{c.locale}</span>
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
                  className={`mt-2 w-full resize-none px-3 py-2 text-t5 ${fieldClass}`}
                />
              ) : (
                <p className="mt-1.5 whitespace-pre-wrap break-words text-t6 text-ink-900">{c.body}</p>
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
                    className={`${inputClass} w-[7.5rem]`}
                  />
                  <Button
                    size="m"
                    variant={active.kind === "edit" ? "primary" : "danger"}
                    onClick={confirmAction}
                    loading={busy}
                    disabled={!busy && !active.password}
                  >
                    {active.kind === "edit" ? t("save") : t("delete")}
                  </Button>
                  <Button size="m" variant="neutral" onClick={() => setMode(null)}>
                    {t("cancel")}
                  </Button>
                  {error && (
                    <p role="alert" className="w-full text-t6 font-semibold text-danger">
                      {error}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-1.5 flex justify-end gap-3 text-t7 text-ink-600">
                  <button
                    type="button"
                    className="hit"
                    onClick={() => {
                      setError(null);
                      setMode({ id: c.id, kind: "edit", body: c.body, password: "" });
                    }}
                  >
                    {t("edit")}
                  </button>
                  <button
                    type="button"
                    className="hit"
                    onClick={() => {
                      setError(null);
                      setMode({ id: c.id, kind: "delete", body: c.body, password: "" });
                    }}
                  >
                    {t("delete")}
                  </button>
                  {reported === c.id ? (
                    <span>{t("reported")}</span>
                  ) : (
                    <button type="button" className="hit" onClick={() => report(c.id)}>
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
