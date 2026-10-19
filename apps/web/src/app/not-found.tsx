import "./globals.css";

import { type Locale, LOCALE_PATH_PREFIX, LOCALES, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";

import { ErrorScreen, type ErrorScreenText } from "./_error/ErrorScreen";
import { BLOCK_ATTR, PICK_LOCALE_STYLE, pickLocaleScript } from "./_error/pick-locale";
import { StaticTabBar, type TabLabels } from "./_error/StaticTabBar";
import { instrument } from "./fonts";

// 어느 화면에도 맞지 않는 주소(/en/foo)와 목록에 없는 상세 주소(dynamicParams=false 인 뷰티·여행·클리닉·드라마·일정·랭킹).
// Next 가 [locale] 레이아웃 밖에서 그리므로 빌드 때 한 번 만든 정적 HTML 이다: 요청마다 함수·DB 를 부르지 않는다.
// 언어를 모르므로 9개 언어를 한 벌씩 그려 두고 주소 첫 마디의 언어만 보인다 (_error/pick-locale.ts).
// noindex 는 Next 가 404 응답에 넣는다
export const metadata: Metadata = { title: SITE_NAME };

async function messagesFor(locale: Locale): Promise<{ text: ErrorScreenText; tabs: TabLabels }> {
  const [root, error, rankings, guide, engage] = await Promise.all([
    import(`../../messages/${locale}.json`),
    import(`../../messages/ns/ErrorPage/${locale}.json`),
    import(`../../messages/ns/Rankings/${locale}.json`),
    import(`../../messages/ns/Guide/${locale}.json`),
    import(`../../messages/ns/Engage/${locale}.json`),
  ]);
  const e = error.default;
  return {
    text: { title: e.notFoundTitle, body: e.notFoundBody, home: e.home, guide: e.guide },
    tabs: {
      nav: root.default.Nav.main,
      home: root.default.Nav.home,
      rankings: rankings.default.tab,
      guide: guide.default.tab,
      saved: engage.default.savedTab,
    },
  };
}

export default async function RootNotFound() {
  const all = await Promise.all(LOCALES.map(async (locale) => ({ locale, ...(await messagesFor(locale)) })));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PICK_LOCALE_STYLE }} />
      <script dangerouslySetInnerHTML={{ __html: pickLocaleScript(instrument.variable) }} />
      {all.map(({ locale, text, tabs }) => {
        const prefix = LOCALE_PATH_PREFIX[locale];
        return (
          <div key={locale} lang={locale} {...{ [BLOCK_ATTR]: locale }} className="min-h-svh antialiased">
            <main className="mx-auto max-w-[640px] pb-[calc(var(--bottom-ui)+24px)]">
              <ErrorScreen code="404" text={text} homeHref={prefix} guideHref={`${prefix}/guide`} />
            </main>
            <StaticTabBar prefix={prefix} labels={tabs} />
          </div>
        );
      })}
    </>
  );
}
