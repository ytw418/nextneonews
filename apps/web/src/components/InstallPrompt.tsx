"use client";

import { SITE_NAME } from "@kmedia/core";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { CloseIcon, MoreIcon, PlusSquareIcon, ShareIcon } from "@/components/icons";
import { isLocaleSuggesting, LOCALE_SUGGEST_DONE } from "@/components/LocaleSuggest";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { usePathname } from "@/i18n/navigation";
import { INSTALL_EVENT_KEY } from "@/lib/install";
import { sessionGet, sessionSet, storageGet, storageSet } from "@/lib/storage";

// 크롬(안드로이드)이 설치 조건을 채우면 보내는 이벤트. 표준이 아니라 타입이 없다
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode = { kind: "android" } | { kind: "ios"; more: boolean };

const DISMISSED_AT = "hb:install-dismissed-at"; // ×로 닫은 시각 (localStorage)
const SEEN = "hb:install-seen"; // 한 방문에 한 번만 (sessionStorage)
const SNOOZE_MS = 7 * 86_400_000;
const FIRST_DELAY_MS = 2000; // 첫 화면을 먼저 보게 하고, 언어 제안이 뜰지 정해질 때까지 기다린다
const SCROLL_PX = 120; // 첫 화면에서는 띄우지 않는다: 처음 그릴 때 '지금 인기' 제목과 1위를 가렸다
const AFTER_SUGGEST_MS = 1000;

function standalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function snoozed(): boolean {
  return Date.now() - Number(storageGet(DISMISSED_AT) ?? 0) < SNOOZE_MS;
}

// 아이폰·아이패드 사파리만 (크롬·인앱 브라우저는 '홈 화면에 추가' 자리가 다르다).
// 사파리 26 부터는 기본 탭 배치에서 공유가 ··· 메뉴 안에 있어 그 단계를 하나 더 보여 준다
function iosSafari(): Mode | null {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (!ios || !/Safari\//.test(ua)) return null;
  if (/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|DuckDuckGo|Instagram|FBAN|FBAV|Line\/|KAKAOTALK|NAVER|Whale/.test(ua)) return null;
  const version = Number(/Version\/(\d+)/.exec(ua)?.[1] ?? 0);
  return { kind: "ios", more: version >= 26 };
}

// 홈 화면에 설치하라는 작은 카드. 탭바 바로 위에 떠 있고 읽기를 막지 않는다 (모달 아님).
// - 안드로이드·크롬: beforeinstallprompt 를 붙잡아 두었다가 '설치' 버튼으로 띄운다
// - 아이폰 사파리: 공유 → 홈 화면에 추가 순서를 아이콘으로 보여 준다
// - 이미 앱으로 열었으면(standalone) 안 띄운다. ×로 닫으면 7일 동안 안 띄운다
// - 첫 화면에서는 띄우지 않고, 조금 스크롤한 뒤에 (읽기 시작한 사람에게)
// - 언어 제안 토스트와 같은 자리라 같이 뜨지 않는다: 언어 제안이 먼저, 내려가고 1초 뒤에
// - 다른 페이지로 옮기면 내려간다 (이번 방문에는 다시 안 띄우고, 다음 방문에 다시)
export function InstallPrompt() {
  const t = useTranslations("Install");
  const tNav = useTranslations("Nav");
  const pathname = usePathname();
  const [shown, setShown] = useState<Mode | null>(null);
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);

  // 다른 페이지로 옮기면 내린다
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setShown(null);
  }

  useEffect(() => {
    // 설치 조건(서비스 워커)은 늘 채워 둔다. 개발 중에는 등록하지 않는다
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (standalone()) return;

    let mode: Mode | null = iosSafari();
    let ready = false;
    let scrolled = false;
    let retry = 0;
    const tryShow = () => {
      if (!ready || !scrolled || !mode || isLocaleSuggesting() || snoozed() || sessionGet(SEEN)) return;
      sessionSet(SEEN, "1");
      setShown(mode);
    };
    // 크롬이 스스로 띄우는 작은 설치 막대는 막는다 (닫은 뒤 7일 약속을 지키려고)
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferred.current = event as BeforeInstallPromptEvent;
      mode = { kind: "android" };
      tryShow();
    };
    const onInstalled = () => setShown(null);
    const onSuggestDone = () => {
      clearTimeout(retry);
      retry = window.setTimeout(tryShow, AFTER_SUGGEST_MS);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    // 하이드레이션 전에 온 것은 레이아웃의 인라인 스크립트가 붙잡아 두었다
    const early = (window as unknown as Record<string, Event | undefined>)[INSTALL_EVENT_KEY];
    if (early) onBeforeInstall(early);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener(LOCALE_SUGGEST_DONE, onSuggestDone);
    const onScroll = () => {
      if (window.scrollY < SCROLL_PX) return;
      scrolled = true;
      window.removeEventListener("scroll", onScroll);
      tryShow();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const first = window.setTimeout(() => {
      ready = true;
      tryShow();
    }, FIRST_DELAY_MS);
    return () => {
      clearTimeout(first);
      clearTimeout(retry);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener(LOCALE_SUGGEST_DONE, onSuggestDone);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!shown) return null;
  const mode = shown;

  const dismiss = () => {
    storageSet(DISMISSED_AT, String(Date.now()));
    setShown(null);
  };
  const install = async () => {
    const event = deferred.current;
    deferred.current = null; // prompt() 는 한 번만 쓸 수 있다
    setShown(null);
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "dismissed") storageSet(DISMISSED_AT, String(Date.now()));
  };

  // 아이폰 순서를 번호 붙은 세로 단계로. 가로로 늘어놓으면 줄이 바뀌어 꺾쇠가 빈 곳을 가리켰다
  const steps = [
    ...(mode.kind === "ios" && mode.more ? [{ icon: <MoreIcon className="size-4" />, label: null }] : []),
    { icon: <ShareIcon className="size-4 text-brand-ink" />, label: t("iosShare") },
    { icon: <PlusSquareIcon className="size-4 text-brand-ink" />, label: t("iosAdd") },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-gutter bottom-[calc(var(--bottom-ui)+12px)] z-40 mx-auto max-w-[400px]">
      <aside
        aria-labelledby="install-title"
        className="pointer-events-auto flex items-center gap-3 rounded-card bg-floating py-2 pr-1 pl-3 shadow-float ring-1 ring-line animate-toast-in"
      >
        {/* 홈 화면에 생길 아이콘 그대로 (apple-icon 과 같은 모양) */}
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-btn-m bg-bg ring-1 ring-line">
          <span className="wordmark">
            H<span className="wordmark-dot">.</span>
          </span>
        </span>
        <div className="min-w-0 flex-1 py-1">
          <p id="install-title" className="text-t6 font-bold text-ink-900">
            {t("title", { name: SITE_NAME })}
          </p>
          {mode.kind === "android" ? (
            <>
              <p className="mt-0.5 text-t7 text-ink-600">{t("body")}</p>
              <Button size="m" className="mt-3" onClick={install}>
                {t("install")}
              </Button>
            </>
          ) : (
            // 한 줄로: 본문을 가리지 않게 (예전 세로 단계 카드는 화면의 1/3을 덮었다)
            <p className="mt-0.5 flex flex-wrap items-center gap-1 text-t7 text-ink-600">
              {steps.map((step, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  {i > 0 && <span aria-hidden>→</span>}
                  {step.icon}
                  {step.label && <span className="font-semibold text-ink-700">{step.label}</span>}
                </span>
              ))}
            </p>
          )}
        </div>
        <IconButton label={tNav("close")} iconSize={5} onClick={dismiss}>
          <CloseIcon />
        </IconButton>
      </aside>
    </div>
  );
}
