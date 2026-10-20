"use client";

import { LINK, type Locale, randomFriendlyName } from "@kmedia/core";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, type RefObject, useEffect, useRef, useState } from "react";

import { MoreIcon, ShuffleIcon } from "@/components/icons";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { Meta } from "@/components/ui/Meta";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { toast } from "@/components/ui/Toast";
import type { PublicComment } from "@/lib/comments";
import { sessionGet, sessionSet, storageGet, storageSet } from "@/lib/storage";
import { timeAgo } from "@/lib/time";
import { track } from "@/lib/track";

const BODY_MAX = 1000; // lib/comments.ts 와 같게 (서버 모듈이라 값은 불러오지 않는다)
// 댓글 목록은 CDN 에 1분 묵는다 (lib/comments.ts COMMENTS_CACHE_SECONDS 와 같게). 이 안에 이 글에 쓰거나 고치거나 지웠으면
// 다시 열 때 주소에 시각을 붙여 캐시를 건너뛴다 — 방금 쓴 댓글이 새로고침하자 사라져 보이지 않게
const COMMENTS_CACHE_MS = 60_000;
const WROTE_STORE = "hb:comment-wrote"; // "글 id:시각" (sessionStorage — 이 탭에서만)
// 이보다 많으면 처음에는 3개만 보이고 '모두 보기'로 편다 (나머지도 DOM 에 두고 CSS 로만 숨긴다)
const COLLAPSED = 3;
// 하단 바(ArticleActionBar)가 댓글 수를 지금 수로 맞추도록 알린다 (서버 HTML 의 수는 몇 분 묵었을 수 있다)
export const COMMENT_COUNT_EVENT = "hb:comment-count";
const KEY_STORE = "hb:comment-key";
const MINE_STORE = "hb:my-comments";
const MINE_MAX = 200;
const NAME_STORE = "hb:comment-name";
const OLD_NAME_STORE = "hb:comment-nickname";

// 17px(t5) 이상이라 아이폰이 입력칸에 초점이 갈 때 화면을 확대하지 않는다. 수정 칸도 같은 모양
const COMPOSER_FIELD =
  "block w-full min-h-12 max-h-[7.5em] resize-none field-sizing-content rounded-btn bg-card px-4 py-3 text-t5 text-ink-900 ring-1 ring-line-control placeholder:text-ink-600 focus:outline-hidden! focus:ring-2 focus:ring-brand";
const SHEET_ROW = "press-row flex min-h-14 w-full items-center px-6 text-t5 font-medium";

type Message = { text: string; retryable: boolean } | null;

// ── 기기 정체성: 비밀번호·닉네임 칸 대신 기기마다 만든 키와 귀여운 이름 ──
// 저장소를 못 쓰는 브라우저(사생활 보호 모드 등)는 이 탭에서만 기억한다
let memoryKey: string | null = null;
let memoryMine: string[] = [];

// 수정·삭제용 키. 서버는 이것을 비밀번호로 받는다 (4~64자)
function deviceKey(): string {
  const saved = storageGet(KEY_STORE) ?? memoryKey;
  if (saved) return saved;
  // randomUUID 는 https 에서만 있어 휴대폰으로 http 개발 서버를 열면 없다
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  memoryKey = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  storageSet(KEY_STORE, memoryKey);
  return memoryKey;
}

function readMine(): string[] {
  const raw = storageGet(MINE_STORE);
  if (!raw) return memoryMine;
  try {
    const list: unknown = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeMine(list: string[]) {
  memoryMine = list.slice(-MINE_MAX);
  storageSet(MINE_STORE, JSON.stringify(memoryMine));
}

// 처음 정한 이름은 바로 저장해서 다른 글에서도 같은 이름으로 보인다
function loadName(locale: Locale): string {
  const saved = storageGet(NAME_STORE) ?? storageGet(OLD_NAME_STORE);
  if (saved) return saved;
  const name = randomFriendlyName(locale);
  storageSet(NAME_STORE, name);
  return name;
}

function markWrote(articleId: string) {
  sessionSet(WROTE_STORE, `${articleId}:${Date.now()}`);
}

function wroteRecently(articleId: string): boolean {
  const [id, at] = (sessionGet(WROTE_STORE) ?? "").split(":");
  return id === articleId && Date.now() - Number(at) < COMMENTS_CACHE_MS;
}

// field-sizing 을 모르는 브라우저는 글 높이에 맞춰 직접 늘린다 (최대 높이는 클래스가 막는다)
function grow(field: HTMLTextAreaElement | null) {
  if (!field || CSS.supports("field-sizing", "content")) return;
  field.style.height = "auto";
  field.style.height = `${field.scrollHeight}px`;
}

function firstGrapheme(text: string): string {
  const trimmed = text.trim();
  if (typeof Intl.Segmenter === "function") {
    for (const { segment } of new Intl.Segmenter().segment(trimmed)) return segment;
  }
  return Array.from(trimmed)[0] ?? "";
}

// 같은 글 안의 같은 사람은 같은 색 (IP 해시로 아바타 틴트 6개 중 하나). 카테고리 색과 섞지 않는다
function avatarTint(idHash: string): number {
  return (parseInt(idHash.slice(0, 8), 16) % 6) + 1 || 1;
}

// 입력창 옆 내 아바타: 아직 IP 해시가 없어 이름으로 색을 고른다 (목록처럼 틴트, 회색이 아니게)
function nameTint(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return (h % 6) + 1;
}

function Avatar({ name, tint, className }: { name: string; tint?: number; className: string }) {
  return (
    <span
      aria-hidden
      className={`grid place-items-center overflow-hidden rounded-full text-t7 leading-none font-bold ${
        tint ? "text-on-tint" : "bg-fill-weak text-ink-700"
      } ${className}`}
      style={tint ? { backgroundColor: `var(--avatar-${tint})` } : undefined}
    >
      {firstGrapheme(name)}
    </span>
  );
}

// 8줄이 넘는 댓글은 접어 두고 '더 보기'로 그 자리에서 편다
function CommentBody({ text, lang, moreLabel }: { text: string; lang: string; moreLabel: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const observer = new ResizeObserver(() => setClamped(el.scrollHeight > el.clientHeight + 1));
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, text]);

  return (
    <>
      <p
        ref={ref}
        lang={lang}
        className={`mt-1 whitespace-pre-wrap break-words text-t6 text-ink-900 ${open ? "" : "line-clamp-8"}`}
      >
        {text}
      </p>
      {clamped && !open && (
        <button type="button" onClick={() => setOpen(true)} className="min-h-11 text-t6 font-semibold text-ink-600">
          {moreLabel}
        </button>
      )}
    </>
  );
}

function SkeletonRow() {
  return (
    <li aria-hidden className="grid grid-cols-[32px_1fr_44px] gap-x-3 border-t border-line py-4">
      <span className="size-8 animate-pulse rounded-full bg-fill-weak" />
      <div className="space-y-2 pt-1">
        <div className="h-3.5 w-24 animate-pulse rounded-full bg-fill-weak" />
        <div className="h-3.5 w-11/12 animate-pulse rounded-full bg-fill-weak" />
        <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-fill-weak" />
      </div>
    </li>
  );
}

interface EditState {
  id: string;
  body: string;
}

interface RowProps {
  comment: PublicComment;
  hidden: boolean;
  locale: string;
  highlight: boolean;
  editing: EditState | null;
  editRef: RefObject<HTMLTextAreaElement | null>;
  editBusy: boolean;
  editError: string | null;
  onEditChange: (body: string) => void;
  onEditClose: () => void;
  onEditSave: () => void;
  onMenu: (comment: PublicComment) => void;
}

function CommentRow({
  comment: c,
  hidden,
  locale,
  highlight,
  editing,
  editRef,
  editBusy,
  editError,
  onEditChange,
  onEditClose,
  onEditSave,
  onMenu,
}: RowProps) {
  const t = useTranslations("Comments");
  const tNav = useTranslations("Nav");
  const editHasLink = editing ? LINK.test(editing.body) : false;

  return (
    <li
      id={`comment-${c.id}`}
      hidden={hidden}
      className={`grid grid-cols-[32px_1fr_44px] gap-x-3 border-t border-line py-4 ${
        highlight ? "animate-[highlight_1200ms_var(--ease-standard)]" : ""
      }`}
    >
      <Avatar name={c.nickname} tint={avatarTint(c.idHash)} className="size-8" />
      <div className={`min-w-0 ${editing ? "col-span-2" : ""}`}>
        {/* 이름·본문은 쓴 사람의 언어로 (한중일 글자 모양이 맞게) */}
        <p lang={c.locale} className="break-words text-t6 font-semibold text-ink-900">
          {c.nickname}
        </p>
        <p className="text-t7 text-ink-600">
          <Meta
            parts={[
              <time key="time" dateTime={c.createdAt}>
                {timeAgo(new Date(c.createdAt), locale)}
              </time>,
              c.edited && t("edited"),
              c.locale !== locale && c.locale.toUpperCase(),
            ]}
          />
        </p>
        {editing ? (
          <form
            className="mt-2"
            onSubmit={(event) => {
              event.preventDefault();
              onEditSave();
            }}
          >
            <textarea
              ref={editRef}
              value={editing.body}
              onChange={(event) => onEditChange(event.target.value)}
              onInput={(event) => grow(event.currentTarget)}
              maxLength={BODY_MAX}
              rows={1}
              aria-label={t("edit")}
              aria-invalid={editHasLink || Boolean(editError) || undefined}
              className={COMPOSER_FIELD}
            />
            {editHasLink && <p className="mt-2 text-t6 font-medium text-danger">{t("noLinks")}</p>}
            {editError && (
              <p role="alert" className="mt-2 text-t6 font-medium text-danger">
                {editError}
              </p>
            )}
            <div className="mt-2 flex justify-end gap-2">
              <Button size="l" variant="neutral" onClick={onEditClose}>
                {tNav("close")}
              </Button>
              <Button type="submit" size="l" variant="primary" loading={editBusy} disabled={!editing.body.trim() || editHasLink}>
                {t("save")}
              </Button>
            </div>
          </form>
        ) : (
          <CommentBody text={c.body} lang={c.locale} moreLabel={t("showMore")} />
        )}
      </div>
      {!editing && (
        <IconButton
          label={t("menu", { name: c.nickname })}
          aria-haspopup="dialog"
          className="-mr-2.5"
          onClick={() => onMenu(c)}
        >
          <MoreIcon className="text-ink-400" />
        </IconButton>
      )}
    </li>
  );
}

// 로그인 없는 댓글. 입력창이 위, 최신 댓글부터. 오류는 토스트가 아니라 그 자리에 보여 준다.
// initialCount 는 글 페이지가 서버에서 센 수: 0 이면 큰 빈 상태 대신 '첫 댓글 남기기' 한 줄 버튼만 그린다 (불러온 뒤 자리가 바뀌지 않게)
export function Comments({ articleId, initialCount }: { articleId: string; initialCount?: number }) {
  const t = useTranslations("Comments");
  const tEngage = useTranslations("Engage");
  const tNav = useTranslations("Nav");
  const locale = useLocale() as Locale;

  const [comments, setComments] = useState<PublicComment[] | null>(null);
  const [total, setTotal] = useState(initialCount ?? 0);
  const [showAll, setShowAll] = useState(false);
  const [composerOpen, setComposerOpen] = useState(initialCount !== 0);
  const [focusComposer, setFocusComposer] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);

  // 입력창
  const formRef = useRef<HTMLFormElement>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Message>(null);

  // ··· 시트 (닫히는 동안에도 내용이 바뀌지 않게 대상과 열림을 따로 둔다)
  const [menuFor, setMenuFor] = useState<{ comment: PublicComment; mine: boolean } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // 수정·삭제
  const editRef = useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PublicComment | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const fresh = wroteRecently(articleId) ? `&t=${Date.now()}` : "";
    fetch(`/api/comments?articleId=${encodeURIComponent(articleId)}${fresh}`)
      .then((res) => (res.ok ? res.json() : { comments: [], total: 0 }))
      .then((data: { comments: PublicComment[]; total: number }) => {
        if (!alive) return;
        setComments(data.comments);
        setTotal(data.total);
      })
      .catch(() => alive && setComments([]));
    return () => {
      alive = false;
    };
  }, [articleId]);

  // '첫 댓글 남기기'를 누르면 펼친 입력창에 바로 초점
  useEffect(() => {
    if (focusComposer) fieldRef.current?.focus();
  }, [focusComposer]);

  // 방금 쓴 댓글이 화면 밖이면 보이는 데까지만 움직인다
  useEffect(() => {
    if (highlight) document.getElementById(`comment-${highlight}`)?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  // 수정 칸이 열리면 글 끝에 커서를 둔다 (시트가 닫히며 돌려준 초점보다 나중에 실행된다)
  const editingId = editing?.id;
  useEffect(() => {
    const field = editRef.current;
    if (!editingId || !field) return;
    grow(field);
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }, [editingId]);

  // 서버 오류 코드 → 무슨 일인지와 할 수 있는 일
  const errorText = (code: unknown, fallback: string) => {
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
        return fallback;
    }
  };

  const hasLink = LINK.test(body);
  const expanded = focused || body !== "";
  const messageId = `comment-message-${articleId}`;

  const submit = async () => {
    if (busy || !body.trim() || hasLink) return;
    const nickname = name || loadName(locale);
    const website = (formRef.current?.elements.namedItem("website") as HTMLInputElement | null)?.value || undefined;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ articleId, locale, nickname, password: deviceKey(), body, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ text: errorText(data.error, t("error")), retryable: res.status >= 500 });
        return;
      }
      const comment = data.comment as PublicComment;
      setComments((list) => [comment, ...(list ?? [])]);
      setTotal((n) => n + 1);
      setBody("");
      if (fieldRef.current) fieldRef.current.style.height = "";
      writeMine([...readMine(), comment.id]);
      markWrote(articleId);
      setHighlight(comment.id);
      toast(t("postedToast"));
      track("comment_submit");
    } catch {
      // 연결이 끊긴 경우: 다시 보내기로 바로 고칠 수 있다
      setError({ text: t("error"), retryable: true });
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit();
  };

  // 섞기: 지금과 다른 이름이 나올 때까지 (조합 144개)
  const shuffle = () => {
    let next = randomFriendlyName(locale);
    for (let i = 0; i < 5 && next === name; i++) next = randomFriendlyName(locale);
    setName(next);
    storageSet(NAME_STORE, next);
  };

  const openMenu = (comment: PublicComment) => {
    setMenuFor({ comment, mine: readMine().includes(comment.id) });
    setReportError(null);
    setMenuOpen(true);
  };

  const startEdit = () => {
    if (!menuFor) return;
    setMenuOpen(false);
    setEditError(null);
    setEditing({ id: menuFor.comment.id, body: menuFor.comment.body });
  };

  const askDelete = () => {
    if (!menuFor) return;
    setMenuOpen(false);
    setDeleteError(null);
    setDeleting(menuFor.comment);
  };

  const report = async () => {
    if (!menuFor || reportBusy) return;
    setReportBusy(true);
    setReportError(null);
    try {
      const res = await fetch(`/api/comments/${menuFor.comment.id}/report`, { method: "POST" });
      if (res.status >= 500) throw new Error(String(res.status));
      setMenuOpen(false);
      toast(t("reportedToast"));
    } catch {
      setReportError(t("failed"));
    } finally {
      setReportBusy(false);
    }
  };

  const save = async () => {
    if (!editing || editBusy || !editing.body.trim() || LINK.test(editing.body)) return;
    const { id } = editing;
    setEditBusy(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: deviceKey(), body: editing.body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(errorText(data.error, t("failed")));
        return;
      }
      const updated = data.comment as PublicComment;
      setComments((list) => list?.map((c) => (c.id === id ? updated : c)) ?? list);
      markWrote(articleId);
      setEditing(null);
    } catch {
      setEditError(t("failed"));
    } finally {
      setEditBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting || deleteBusy) return;
    const { id } = deleting;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: deviceKey() }),
      });
      // 404 는 이미 지워졌거나 숨겨진 것이라 목록에서도 뺀다
      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(errorText(data.error, t("failed")));
        return;
      }
      setComments((list) => list?.filter((c) => c.id !== id) ?? list);
      setTotal((n) => Math.max(0, n - 1));
      writeMine(readMine().filter((mine) => mine !== id));
      markWrote(articleId);
      setDeleting(null);
    } catch {
      setDeleteError(t("failed"));
    } finally {
      setDeleteBusy(false);
    }
  };

  const count = Math.max(total, comments?.length ?? 0);
  const loaded = comments !== null;
  useEffect(() => {
    if (loaded) window.dispatchEvent(new CustomEvent(COMMENT_COUNT_EVENT, { detail: { articleId, count } }));
  }, [articleId, count, loaded]);
  const message = hasLink ? null : error;
  // 그사이 다른 사람이 댓글을 남겼으면(서버 수 0 → 불러온 목록 1개 이상) 입력창을 그대로 보인다
  const showComposer = composerOpen || (comments?.length ?? 0) > 0;
  const collapsed = !showAll && (comments?.length ?? 0) > COLLAPSED;

  return (
    <section id="comments" aria-labelledby="comments-title" className="scroll-mt-20">
      <SectionHeader id="comments-title" inset="read" title={t("title")} count={count} />

      <div className="px-read">
        {!showComposer && (
          <Button
            size="l"
            variant="weak"
            block
            onClick={() => {
              setComposerOpen(true);
              setFocusComposer(true);
            }}
          >
            {tEngage("firstComment")}
          </Button>
        )}
        <form
          ref={formRef}
          hidden={!showComposer}
          onSubmit={onSubmit}
          onFocus={() => {
            setFocused(true);
            if (!name) setName(loadName(locale));
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
          }}
        >
          <textarea
            ref={fieldRef}
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              if (error) setError(null);
            }}
            onInput={(event) => grow(event.currentTarget)}
            maxLength={BODY_MAX}
            rows={1}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            aria-invalid={hasLink || Boolean(error) || undefined}
            aria-describedby={hasLink || message ? messageId : undefined}
            className={COMPOSER_FIELD}
          />
          {/* 봇만 채우는 칸 */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          {hasLink && (
            <p id={messageId} className="mt-2 text-t6 font-medium text-danger">
              {t("noLinks")}
            </p>
          )}
          {message && (
            <p id={messageId} role="alert" className="mt-2 flex flex-wrap items-center gap-x-3 text-t6 font-medium text-danger">
              {message.text}
              {message.retryable && (
                <button
                  type="button"
                  onClick={() => void submit()}
                  className="min-h-11 font-semibold underline underline-offset-4"
                >
                  {t("retry")}
                </button>
              )}
            </p>
          )}

          {expanded && (
            <>
              {/* 이름은 자르지 않는다: 한 줄에 안 들어가면(360px·큰 글씨) 버튼이 다음 줄 오른쪽으로 내려간다.
                  아바타는 em 이라 글자를 키워도 첫 글자가 잘리지 않는다 */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="flex min-h-11 min-w-fit flex-1 items-center gap-2 text-t7 font-semibold text-ink-700">
                  <Avatar name={name} tint={name ? nameTint(name) : undefined} className="size-[1.85em] shrink-0" />
                  <span>{name}</span>
                </span>
                <IconButton
                  label={t("changeName")}
                  // 누르는 동안 입력창 초점을 뺏지 않는다 (아이폰에서 줄이 접히며 버튼이 사라지지 않게)
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={shuffle}
                >
                  <ShuffleIcon className="text-ink-600" />
                </IconButton>
                <Button
                  type="submit"
                  size="l"
                  variant="primary"
                  className="ml-auto"
                  disabled={!body.trim() || hasLink}
                  loading={busy}
                >
                  {t("submit")}
                </Button>
              </div>
              <p className="mt-2 text-t7 text-ink-600">{t("policy")}</p>
            </>
          )}
        </form>

        {/* 서버 수가 0 이면 불러오는 동안에도 빈 줄(스켈레톤)을 그리지 않는다 */}
        {comments?.length !== 0 && (comments !== null || initialCount !== 0) && (
          <ul className="mt-4" aria-busy={comments === null || undefined}>
            {comments === null ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              comments.map((c, i) => (
                <CommentRow
                  key={c.id}
                  hidden={collapsed && i >= COLLAPSED}
                  comment={c}
                  locale={locale}
                  highlight={c.id === highlight}
                  editing={editing?.id === c.id ? editing : null}
                  editRef={editRef}
                  editBusy={editBusy}
                  editError={editError}
                  onEditChange={(next) => setEditing((current) => (current ? { ...current, body: next } : current))}
                  onEditClose={() => setEditing(null)}
                  onEditSave={() => void save()}
                  onMenu={openMenu}
                />
              ))
            )}
          </ul>
        )}

        {collapsed && (
          <Button size="l" variant="neutral" block className="mt-2" onClick={() => setShowAll(true)}>
            {tEngage("allComments", { count })}
          </Button>
        )}
      </div>

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={t("options")}>
        {menuFor?.mine ? (
          <>
            <button type="button" onClick={startEdit} className={`${SHEET_ROW} text-ink-900`}>
              {t("edit")}
            </button>
            <button type="button" onClick={askDelete} className={`${SHEET_ROW} text-danger`}>
              {t("delete")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void report()}
              aria-busy={reportBusy || undefined}
              className={`${SHEET_ROW} text-ink-900`}
            >
              {t("report")}
            </button>
            {reportError && (
              <p role="alert" className="px-6 pb-3 text-t6 font-medium text-danger">
                {reportError}
              </p>
            )}
          </>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className={`${SHEET_ROW} border-t border-line text-ink-600`}
        >
          {tNav("cancel")}
        </button>
      </BottomSheet>

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t("deleteTitle")}
        body={
          deleteError ? (
            <p role="alert" className="font-medium text-danger">
              {deleteError}
            </p>
          ) : undefined
        }
        confirmLabel={t("delete")}
        tone="danger"
        loading={deleteBusy}
        onConfirm={() => void remove()}
      />
    </section>
  );
}
