"use client";

import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";

import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { useAppMode } from "@/lib/use-app-mode";
import { appPlatform } from "@/lib/install";
import { normalizeEmail, type SubscribeSource } from "@/lib/subscribe-rules";
import { track } from "@/lib/track";

type State = "idle" | "sending" | "done" | "invalid" | "tooMany" | "failed";

// 이메일 한 칸: '앱이 나오면 알림' + (따로 체크하면) 주간 소식. 저장함 아래·피부 타입 결과에 둔다 (source 로 나눈다).
// 받아 두기만 하고 아직 보내지 않는다 — 발송은 확인 메일과 함께 붙인다 (docs/decisions/app-2026-10-21.md).
// 앱을 만들지 정하는 숫자(특히 iOS 대기 명단)도 여기서 센다: 화면에 보였는지(subscribe_view)·냈는지(subscribe_submit).
// 이미 있는 주소인지는 알리지 않는다 (서버도 늘 같은 답). 주간 소식은 미리 체크해 두지 않는다 (동의는 직접 고른 것만)
export function SubscribeBox({ source, className = "" }: { source: SubscribeSource; className?: string }) {
  const t = useTranslations("Engage");
  const locale = useLocale();
  const id = useId();
  const box = useRef<HTMLElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const trap = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [news, setNews] = useState(false);
  const [state, setState] = useState<State>("idle");
  const app = useAppMode();

  // 반쯤 보이면 한 번 센다 (노출 대비 제출률)
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        track("subscribe_view", { source });
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [source]);

  // 끝나면 입력 칸이 사라지니 초점을 결과 문장으로 옮긴다 (화면 읽기가 결과를 읽고, 초점이 문서 처음으로 튀지 않게)
  useEffect(() => {
    if (state === "done") status.current?.focus();
  }, [state]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (state === "sending") return;
    if (!normalizeEmail(email)) {
      setState("invalid");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, locale, source, news, platform: appPlatform(), website: trap.current?.value ?? "" }),
      });
      if (res.ok) {
        track("subscribe_submit", { source, news });
        setState("done");
      } else setState(res.status === 400 ? "invalid" : res.status === 429 ? "tooMany" : "failed");
    } catch {
      setState("failed");
    }
  };

  if (app) return null;

  const privacyLink = (chunks: ReactNode) => (
    <Link href="/privacy" className="font-semibold text-ink-700 underline underline-offset-4">
      {chunks}
    </Link>
  );
  const error = state === "invalid" ? t("subscribeInvalid") : state === "tooMany" ? t("subscribeTooMany") : state === "failed" ? t("subscribeFailed") : null;

  return (
    // data-install-avoid: 칸이 화면 아래쪽에 보일 때는 설치 카드가 뜨지 않는다 (카드가 입력 칸·동의 문구를 덮었다, InstallPrompt AVOID)
    <section
      ref={box}
      data-install-avoid
      aria-labelledby={`${id}-title`}
      className={`mx-gutter rounded-card bg-card px-4 py-5 shadow-card ${locale === "ko" ? "[word-break:keep-all]" : ""} ${className}`}
    >
      <h2 id={`${id}-title`} className="text-t5 font-bold text-ink-900">
        {t("subscribeTitle")}
      </h2>
      {state === "done" ? (
        <p ref={status} tabIndex={-1} role="status" className="mt-2 flex items-start gap-2 text-t6 text-ink-700 outline-hidden">
          <CheckIcon className="mt-0.5 size-5 shrink-0 text-brand-ink" />
          {news ? t("subscribeDoneNews") : t("subscribeDone")}
        </p>
      ) : (
        <>
          <p className="mt-1 text-t6 text-ink-600">{t("subscribeBody")}</p>
          {/* noValidate: type="email" 의 브라우저 말풍선 대신 아래 안내 문구를 쓴다 (PasteLink 와 같다) */}
          <form onSubmit={(event) => void submit(event)} noValidate className="mt-4">
            <label htmlFor={`${id}-email`} className="text-t7 font-semibold text-ink-700">
              {t("subscribeEmail")}
            </label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {/* 17px(t5) 이상이라 아이폰이 초점 때 화면을 확대하지 않는다 */}
              <input
                id={`${id}-email`}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="send"
                maxLength={254}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setState("idle");
                }}
                aria-invalid={state === "invalid" || undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className="min-h-12 min-w-48 flex-1 rounded-btn bg-bg px-4 text-t5 text-ink-900 ring-1 ring-line-control focus:outline-hidden! focus:ring-2 focus:ring-brand"
              />
              <Button type="submit" size="l" loading={state === "sending"} disabled={!email.trim()}>
                {t("subscribeSubmit")}
              </Button>
            </div>
            {/* 사람에게는 안 보이는 칸. 로봇이 채워 보내면 서버가 저장하지 않는다 */}
            <input ref={trap} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
            {error && (
              <p id={`${id}-error`} role="alert" className="mt-2 text-t6 font-medium text-danger">
                {error}
              </p>
            )}
            <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3">
              <input type="checkbox" checked={news} onChange={(event) => setNews(event.target.checked)} className="peer sr-only" />
              <span
                aria-hidden
                className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-line-control text-white peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
              >
                {news && <CheckIcon className="size-4" />}
              </span>
              <span className="text-t6 text-ink-700">{t("subscribeNews")}</span>
            </label>
            <p className="mt-2 text-t7 text-ink-600">{t.rich("subscribeConsent", { privacy: privacyLink })}</p>
          </form>
        </>
      )}
    </section>
  );
}
