import { articlePath, categorySlug, type CategoryKey, localeHomePath } from "@kmedia/core";

import { notifyIndexNow } from "./indexnow";
import { revalidateSite, warm } from "./site";

// 새 글·새 언어판·내린 글을 바로 알린다: 사이트 캐시(사이트맵·홈·피드·카테고리·그 글)를 비우고, 비운 화면을 지금 다시 요청해
// 새로 그리게 한 뒤 IndexNow 에 URL 을 보낸다. 실패해도 경고만 남긴다 — 글 작성·번역은 계속 돌아야 한다.
// 웹 화면은 시간이 지나도 다시 만들지 않으므로(revalidate = false) 여기서 비우지 않은 화면은 다음 비우기까지 그대로다

export interface AnnouncedPage {
  locale: string;
  slug: string;
  category: CategoryKey;
  indexable: boolean; // noindex 판은 목록만 새로 그리고 검색엔진에는 알리지 않는다
}

// 비울 주소 (브라우저 주소). 글 화면은 새 글이면 처음 그리는 것이고, 내린 글·번역이 붙은 글이면 캐시된 화면(또는 다른 언어로 보내던 이동)을 지운다
function announcedPaths(pages: AnnouncedPage[]): { revalidate: string[]; warm: string[] } {
  const lists = new Set(["/sitemap.xml", "/news-sitemap.xml"]);
  const articles = new Set<string>();
  const markdown = new Set<string>();
  for (const { locale, slug, category } of pages) {
    const home = localeHomePath(locale);
    lists.add(home);
    lists.add(`${home}/feed.xml`);
    lists.add(`${home}/c/${categorySlug(category)}`);
    articles.add(articlePath(locale, slug));
    markdown.add(`${articlePath(locale, slug)}/md`);
  }
  // 마크다운판은 비우기만 한다 (AI 에이전트가 가끔 읽는 주소라 미리 그려 둘 만큼 자주 오지 않는다)
  return { revalidate: [...lists, ...articles, ...markdown], warm: [...lists, ...articles] };
}

export async function announce(pages: AnnouncedPage[]): Promise<void> {
  if (pages.length === 0) return;
  const siteUrl = process.env.SITE_URL ?? "";
  const paths = announcedPaths(pages);
  // 메뉴·푸터의 '글이 있는 카테고리' 목록은 웹이 날짜별로 다시 읽는다 (apps/web/src/lib/articles.ts). 여기서 태그를 비우면
  // 그 목록을 쓰는 모든 화면이 낡은 판이 되어 봇이 DB 를 깨우므로 비우지 않는다
  await revalidateSite({ paths: paths.revalidate });
  await warm(paths.warm);
  // 검색엔진이 오기 전에 새 판을 그려 두려고 IndexNow 는 미리 요청 뒤에 보낸다
  const urls = pages.filter((p) => p.indexable).map((p) => `${siteUrl}${articlePath(p.locale, p.slug)}`);
  await notifyIndexNow(urls);
}
