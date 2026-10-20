import { categorySlug, type Locale, LOCALE_NAME, LOCALE_PATH_PREFIX, LOCALES, SITE_NAME } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { SECTION_PATH, SECTIONS } from "@/data/sections";
import { Link } from "@/i18n/navigation";
import { listActiveCategories } from "@/lib/articles";
import { categoryTint } from "@/lib/cover";
import { feedPath } from "@/lib/url";

// 묶음 제목은 메뉴 시트와 같은 모양
const HEAD = "text-t7 font-semibold text-ink-600";
// 세로 링크 줄: 글자는 작아도 누르는 높이는 44px
const ROW = "flex min-h-11 items-center text-t6 font-medium text-ink-700";

// 모든 화면 맨 아래의 서버 렌더링 푸터. 메뉴 시트(클라이언트) 안 링크는 크롤러가 못 보므로
// 카테고리(글이 있는 것만)·가이드 섹션·일정·랭킹·RSS·소개·제휴 고지 페이지·9개 언어 홈을 진짜 <a href> 로 한 번 더 깐다
export async function SiteFooter({ locale }: { locale: Locale }) {
  const [t, tNav, tCat, tGuide, categories] = await Promise.all([
    getTranslations("Seo.footer"),
    getTranslations("Nav"),
    getTranslations("Category"),
    getTranslations("Guide"),
    listActiveCategories(locale),
  ]);
  const [word, ...rest] = SITE_NAME.split(" ");

  return (
    <footer className="mt-12 border-t border-line px-gutter pt-6 pb-4">
      <Link href="/" aria-label={SITE_NAME} className="inline-flex min-h-11 items-center">
        <span aria-hidden className="flex items-baseline">
          <span className="wordmark">
            {word}
            <span className="wordmark-dot">.</span>
          </span>
          <span className="wordmark-sub">{rest.join(" ")}</span>
        </span>
      </Link>
      {/* AI 고지는 사실대로 (글 페이지의 고지와 같은 말) */}
      <p className="mt-1 text-t7 text-ink-600">{t("aiNote")}</p>

      <nav aria-label={t("nav")} className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6">
        {categories.length > 0 && (
          <section aria-labelledby="footer-topics" className="col-span-2">
            <h2 id="footer-topics" className={`${HEAD} pb-2`}>
              {t("topics")}
            </h2>
            {/* 칩은 메뉴 시트·메모 커버와 같은 카테고리 틴트 */}
            <ul className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <li key={c}>
                  <Link
                    href={`/c/${categorySlug(c)}`}
                    style={{ backgroundColor: categoryTint(c) }}
                    className="press hit inline-flex min-h-[38px] items-center rounded-full px-3.5 text-t6 font-semibold text-on-tint"
                  >
                    {tCat(c)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="footer-explore">
          <h2 id="footer-explore" className={`${HEAD} pb-1`}>
            {t("explore")}
          </h2>
          <ul>
            <li>
              <Link href="/guide" className={ROW}>
                {t("guide")}
              </Link>
            </li>
            {/* 가이드 섹션 이름은 가이드 허브 타일과 같은 문구 */}
            {SECTIONS.map((section) => (
              <li key={section}>
                <Link href={SECTION_PATH[section]} className={ROW}>
                  {tGuide(`sections.${section}.title`)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/schedule" className={ROW}>
                {tNav("schedule")}
              </Link>
            </li>
            <li>
              <Link href="/rankings" className={ROW}>
                {t("rankings")}
              </Link>
            </li>
            {/* RSS 는 앱 웹뷰에서 열 데가 없다 */}
            <li className="app-hide">
              {/* 점 붙은 주소라 언어 미들웨어를 거치지 않는다: 접두사를 직접 붙인다 */}
              <a href={feedPath(locale)} type="application/rss+xml" className={ROW}>
                {t("rss")}
              </a>
            </li>
          </ul>
        </section>

        <section aria-labelledby="footer-about">
          <h2 id="footer-about" className={`${HEAD} pb-1`}>
            {SITE_NAME}
          </h2>
          <ul>
            <li>
              <Link href="/about" className={ROW}>
                {t("about")}
              </Link>
            </li>
            <li>
              <Link href="/editorial-policy" className={ROW}>
                {t("editorialPolicy")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className={ROW}>
                {t("contact")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className={ROW}>
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/partners" className={ROW}>
                {t("partners")}
              </Link>
            </li>
            <li>
              <Link href="/disclosure" className={ROW}>
                {t("disclosure")}
              </Link>
            </li>
          </ul>
        </section>

        <section aria-labelledby="footer-languages" className="col-span-2">
          <h2 id="footer-languages" className={`${HEAD} pb-1`}>
            {t("languages")}
          </h2>
          {/* 언어 홈은 hreflang 을 단 진짜 링크. 언어 이름은 그 언어로 쓴다 */}
          <ul className="flex flex-wrap gap-x-4">
            {LOCALES.map((l) => (
              <li key={l}>
                <a
                  href={LOCALE_PATH_PREFIX[l]}
                  hrefLang={l}
                  lang={l}
                  aria-current={l === locale ? "true" : undefined}
                  className={`flex min-h-11 items-center text-t6 ${l === locale ? "font-bold text-ink-900" : "font-medium text-ink-700"}`}
                >
                  {LOCALE_NAME[l]}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </nav>
    </footer>
  );
}
