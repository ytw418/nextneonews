"use client";

import "./globals.css";

import { type Locale, LOCALE_PATH_PREFIX, LOCALES, SITE_NAME } from "@kmedia/core";
import { useEffect, useSyncExternalStore } from "react";

import { captureBoundaryError } from "@/lib/posthog";
import { localeFromPrefix } from "@/lib/url";

import en from "../../messages/ns/ErrorPage/en.json";
import fr from "../../messages/ns/ErrorPage/fr.json";
import id from "../../messages/ns/ErrorPage/id.json";
import ja from "../../messages/ns/ErrorPage/ja.json";
import ko from "../../messages/ns/ErrorPage/ko.json";
import ru from "../../messages/ns/ErrorPage/ru.json";
import vi from "../../messages/ns/ErrorPage/vi.json";
import zhCN from "../../messages/ns/ErrorPage/zh-CN.json";
import zhTW from "../../messages/ns/ErrorPage/zh-TW.json";
import { ErrorScreen } from "./_error/ErrorScreen";
import { BLOCK_ATTR, PICK_LOCALE_STYLE, pickLocaleScript } from "./_error/pick-locale";
import { instrument } from "./fonts";

// 레이아웃([locale]/layout.tsx)까지 실패했을 때 그 대신 그리는 문서. DB 가 꺼져 푸터의 카테고리 조회가 실패하면 여기로 온다.
// 이 모듈은 모든 화면의 첫 자바스크립트에 실린다: 문구는 작은 ErrorPage 파일(언어당 약 0.4KB)만 싣고,
// 탭바처럼 다른 네임스페이스가 필요한 부품은 넣지 않는다. 훅·next-intl·DB 를 쓰지 않는다
const MESSAGES: Record<Locale, typeof en> = {
  en,
  ja,
  "zh-TW": zhTW,
  "zh-CN": zhCN,
  ko,
  vi,
  id,
  fr,
  ru,
};

const noSubscribe = () => () => {};
const localeOfPage = (): Locale => localeFromPrefix(window.location.pathname.split("/")[1] ?? "") ?? "en";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => captureBoundaryError(error), [error]);
  // 서버 HTML 은 언어를 몰라 9벌을 그리고 <head> 스크립트가 한 벌만 보이게 한다. 하이드레이션 뒤에는 그 한 벌만 남긴다
  const locale = useSyncExternalStore(noSubscribe, localeOfPage, () => null);
  const shown = locale ? [locale] : LOCALES;

  return (
    <html lang={locale ?? "en"} className={instrument.variable} suppressHydrationWarning>
      <head>
        <title>{SITE_NAME}</title>
        <style dangerouslySetInnerHTML={{ __html: PICK_LOCALE_STYLE }} />
        <script dangerouslySetInnerHTML={{ __html: pickLocaleScript() }} />
      </head>
      <body className="min-h-svh antialiased">
        {shown.map((l) => {
          const m = MESSAGES[l];
          const home = LOCALE_PATH_PREFIX[l];
          return (
            <main key={l} lang={l} {...(locale ? {} : { [BLOCK_ATTR]: l })} className="mx-auto max-w-[640px] pb-6">
              <ErrorScreen
                code="500"
                text={{ title: m.errorTitle, body: m.errorBody, home: m.home, guide: m.guide }}
                homeHref={home}
                guideHref={`${home}/guide`}
                retry={{ label: m.retry, onClick: retry }}
              />
            </main>
          );
        })}
      </body>
    </html>
  );
}
