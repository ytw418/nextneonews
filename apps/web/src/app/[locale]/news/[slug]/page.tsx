import { categorySlug, faqNotInBody, findEventForArticle, isLocale, readMinutes } from "@kmedia/core";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ReactMarkdown from "react-markdown";

import { AdSlot } from "@/components/AdSlot";
import { AffiliateBox } from "@/components/affiliate/AffiliateBox";
import { AppHeader } from "@/components/AppHeader";
import { ArticleThumb } from "@/components/ArticleThumb";
import { ArticleActionBar } from "@/components/article/ArticleActionBar";
import { CurrentArticleSaveButton } from "@/components/article/CurrentArticleSaveButton";
import { NetizenCard } from "@/components/article/NetizenCard";
import { type CurrentArticle, NextArticleLoader } from "@/components/article/NextArticleLoader";
import { PollCard } from "@/components/article/PollCard";
import { ReactionBar } from "@/components/article/ReactionBar";
import { ReadingProgress } from "@/components/article/ReadingProgress";
import { RelatedEventCard } from "@/components/article/RelatedEventCard";
import { UpNextCard } from "@/components/article/UpNextCard";
import { Comments } from "@/components/Comments";
import { CoupangBanner } from "@/components/CoupangBanner";
import { FeedCard, itemTime } from "@/components/FeedCard";
import { CrossRail } from "@/components/guide/CrossRail";
import { ChevronDownIcon, ChevronRightIcon, ExternalIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { MemoCover } from "@/components/MemoCover";
import { PhotoCredit } from "@/components/PhotoCredit";
import { Phrase } from "@/components/Phrase";
import { RANKED_MIN, RankedArticles, THUMB_LARGE_TEXT } from "@/components/RankedArticles";
import { EntityRankStrip } from "@/components/rankings/EntityRankStrip";
import { ShareButton } from "@/components/ShareButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ListRow } from "@/components/ui/ListRow";
import { Meta } from "@/components/ui/Meta";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ViewPing } from "@/components/ViewPing";
import { travelText } from "@/data/travel";
import { Link } from "@/i18n/navigation";
import {
  entityNames,
  findTranslatedLocale,
  getArticle,
  listLatest,
  listPopular,
  listRelated,
  toFeedItems,
} from "@/lib/articles";
import { articlePrepFor, coupangBannerFor } from "@/lib/ads";
import { coverStyle } from "@/lib/cover";
import { commentCount, netizenView, nextCandidates, pollView, readReactions } from "@/lib/engagement";
import { matchArticleEntities } from "@/lib/entities";
import { imgSrc } from "@/lib/image";
import { publisherName } from "@/lib/publishers";
import { articleJsonLd } from "@/lib/jsonld";
import { displayName } from "@/lib/rankings";
import { dateStamp } from "@/lib/time";
import { articlePath, feedAlternate, localeHomePath, ogBase, pageRobots, SITE_URL } from "@/lib/url";

// 시간이 지나도 다시 만들지 않는다. 글을 내거나 내릴 때, 하루 1번 최근·반응이 온 글을 worker 가 비우고 바로 다시 요청한다
// (apps/worker/src/pipeline/announce.ts · refresh.ts). 시간 기반 재생성은 봇 방문마다 DB 를 깨워 Neon 무료 한도를 넘겼다 (2026-10-19)
export const revalidate = false;

// 글 페이지는 빌드 때 만들지 않고 첫 요청 때 만든 뒤 캐시한다.
export function generateStaticParams() {
  return [];
}

interface Faq {
  q: string;
  a: string;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function generateMetadata({ params }: PageProps<"/[locale]/news/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const translation = await getArticle(locale, slug);
  if (!translation) {
    return {};
  }

  const languages: Record<string, string> = Object.fromEntries(
    translation.article.translations.map((t) => [t.locale, articlePath(t.locale, t.slug)]),
  );
  if (languages.en) {
    languages["x-default"] = languages.en;
  }

  const description = translation.seoDesc ?? translation.summary;
  const image = translation.article.media[0]?.url;
  const title = translation.seoTitle ?? translation.title;
  const canonical = articlePath(locale, slug);
  // 고친 시각: 제목·본문을 바꾼 때 (updatedAt 은 조회 수가 오를 때마다 바뀐다)
  const modified = translation.article.contentUpdatedAt ?? translation.article.publishedAt;
  return {
    // 긴 제목은 사이트명을 붙이지 않는다 (검색 결과에서 잘리지 않게)
    title: title.length > 45 ? { absolute: title } : title,
    description,
    // 마크다운판(AI 에이전트용)과 이 언어 RSS 를 <link rel="alternate"> 로 알린다
    alternates: { canonical, languages, types: { "text/markdown": `${canonical}/md`, ...feedAlternate(locale) } },
    robots: pageRobots(translation.indexable),
    openGraph: {
      ...ogBase(locale),
      type: "article",
      url: canonical,
      title: translation.title,
      description,
      publishedTime: translation.article.publishedAt?.toISOString(),
      modifiedTime: modified?.toISOString(),
      images: [image ?? `${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ArticlePage({ params }: PageProps<"/[locale]/news/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const translation = await getArticle(locale, slug);
  if (!translation) {
    // 이 언어 번역이 아직 없으면(배치 번역 대기 등) 있는 언어로 잠시 보낸다
    const other = await findTranslatedLocale(slug);
    if (other && other !== locale) redirect(articlePath(other, slug));
    notFound();
  }
  const { article } = translation;
  const [t, tCat, tEngage, tIdol, relatedRows, popularRows, latestRows, comments, entityMatches] = await Promise.all([
    getTranslations("Article"),
    getTranslations("Category"),
    getTranslations("Engage"),
    getTranslations("Idol"),
    listRelated(locale, article, 7),
    listPopular(locale, 12),
    listLatest(locale, 24),
    commentCount(article.id),
    matchArticleEntities(article.entities),
  ]);
  // 다음 글 후보 (같은 인물 → 가이드 → 같은 카테고리 → 이번 주 인기). 첫 번째가 'Up next' 카드, 나머지는 끝에 이어 붙인다
  const nextRows = await nextCandidates(locale, translation, popularRows);
  const upNextRow = nextRows[0];
  // 함께 읽기는 'Up next' 와 겹치지 않게, 이번 주 인기 글에서는 이 글과 '함께 읽기'에 이미 나온 글을 뺀다
  const relatedPicked = relatedRows.filter((r) => r.slug !== upNextRow?.slug).slice(0, 6);
  const shown = new Set([slug, ...relatedPicked.map((r) => r.slug)]);
  const popularPicked = popularRows.filter((r) => !shown.has(r.slug)).slice(0, 5);
  // 맨 끝 '더 많은 이야기': 위에 나온 글과 이어 붙일 후보를 뺀 최신 글 6개
  const seen = new Set([...shown, ...popularPicked.map((r) => r.slug), ...nextRows.map((r) => r.slug)]);
  const [related, popularItems, upNextItems, more] = await Promise.all([
    toFeedItems(relatedPicked, locale),
    toFeedItems(popularPicked, locale),
    toFeedItems(upNextRow ? [upNextRow] : [], locale),
    toFeedItems(latestRows.filter((r) => !seen.has(r.slug)).slice(0, 6), locale),
  ]);
  const popular = popularItems.length >= RANKED_MIN ? popularItems : [];
  const upNext = upNextItems[0];

  // 참여 모듈: 투표는 열려 있고 이 언어 문구가 있을 때만, 커뮤니티 반응은 숫자와 요약이 둘 다 있을 때만
  const poll = pollView(article.poll, translation.poll);
  const netizen = netizenView(article.netizen, translation.netizen);
  const reactions = readReactions(article.reactions);
  const current: CurrentArticle = {
    id: article.id,
    slug,
    title: translation.title,
    url: articlePath(locale, slug),
    commentCount: comments,
    reactions,
  };
  // 공식·뉴스 출처와 커뮤니티(반응) 출처를 나눈다. 커뮤니티 링크는 nofollow
  const newsSources = article.sources.filter((s) => s.kind !== "COMMUNITY");
  const communitySources = article.sources.filter((s) => s.kind === "COMMUNITY");

  // 글에 나온 인물 중 인물 사전에 있는 사람 (겹치지 않게). 순위 칩은 id, '#이름' 칩은 인물 페이지가 있는(slug) 사람만
  const people = [...new Map(entityMatches.flatMap((e) => (e ? [[e.id, e] as const] : []))).values()];
  const idolChips = people.filter((e) => e.slug);
  // JSON-LD about: id 가 없는 옛 글도 사전에서 찾은 위키데이터 id 로 sameAs 를 잇는다
  const ldEntities = asArray<{ id?: string; name: string; type: string }>(article.entities).map((e, i) => ({
    ...e,
    id: e.id ?? entityMatches[i]?.id,
  }));

  const keyPoints = asArray<string>(translation.keyPoints);
  // 본문 소제목을 되풀이하는 질문은 화면과 JSON-LD 둘 다에서 뺀다
  const faq = faqNotInBody(asArray<Faq>(translation.faq), translation.body);
  const hero = article.media[0];
  // 긴 제목(러시아어·프랑스어·베트남어에 흔하다)은 한 단계 작게: st2 로 7줄이 되어 사진 속 얼굴을 덮었다
  const longTitle = translation.title.length > 70;
  const categoryLabel = tCat(article.category);
  const url = `${SITE_URL}${articlePath(locale, slug)}`;
  // 글에 나오는 다가오는 일정 (컴백·시상식 등). 있으면 요약 밑에 카드 한 줄
  const event = findEventForArticle({
    title: translation.title,
    entityNames: entityNames(article.entities),
    publishedAt: article.publishedAt,
  });

  const published = article.publishedAt;
  // 정정 요청 메일 주소는 설정했을 때만 (주소를 코드에 박지 않는다)
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  // 쿠팡 배너는 원래 글에 하나만 (이어 붙이는 다음 글에는 광고를 넣지 않는다). 한국어가 아닌 페이지는 한국어 대가성 문구도 함께
  const coupang = coupangBannerFor({ locale, category: article.category, format: article.format });
  const coupangKo =
    coupang && locale !== "ko" ? (await getTranslations({ locale: "ko", namespace: "Article" }))("coupang") : undefined;
  // 생활 글(여행·워홀·유학·집)은 글 끝에 여행 준비 제휴 상자 (eSIM·공항 이동·숙소, 한국어판 제외). 이름은 여행 카탈로그 문구를 쓴다
  const prepRows = articlePrepFor(article.category, locale);
  const prep = prepRows.length > 0 ? (await travelText(locale)).prep : null;

  return (
    <>
      <AppHeader
        variant="pushed"
        parentHref="/"
        title={translation.title}
        action={
          <>
            {/* 저장 키는 글 slug (번역이 모두 같은 slug 를 쓴다 — 저장함이 (언어, slug) 로 제목을 찾는다) */}
            <CurrentArticleSaveButton slug={slug} title={translation.title} />
            <ShareButton title={translation.title} label={t("share")} copiedLabel={t("copied")} />
          </>
        }
      />
      <ReadingProgress />

      {/* 읽기 단위(진행 막대·주소 바꾸기의 기준): 히어로부터 AI 고지까지. 'Up next'·댓글·함께 읽기는 글 밖에 둔다 */}
      <article data-article-block={article.id} data-slug={slug} data-url={current.url} data-title={translation.title}>
        <JsonLd
          data={articleJsonLd({
            url,
            locale,
            title: translation.title,
            description: translation.seoDesc ?? translation.summary,
            category: article.category,
            categoryLabel,
            categoryUrl: `${SITE_URL}${localeHomePath(locale)}/c/${categorySlug(article.category)}`,
            publishedAt: article.publishedAt,
            modifiedAt: article.contentUpdatedAt ?? article.publishedAt,
            faq,
            entities: ldEntities,
            sourceUrls: article.sources.map((s) => s.url),
            sources: article.sources.map((s) => ({ url: s.url, publisher: publisherName(s.publisher, locale) })),
            image: hero?.url,
            homeUrl: `${SITE_URL}${localeHomePath(locale)}`,
            aiNotice: t("aiNotice"),
            speakable: keyPoints.length > 0 ? ["#kp", ".article-summary"] : [".article-summary"],
          })}
        />

        {hero ? (
          // 공식 이미지가 있으면 화면을 꽉 채우는 매거진 커버. 제목 블록이 흐름 안에 있어 긴 제목이면 커버가 늘어난다
          <figure className="relative flex min-h-[min(125vw,800px,78svh)] w-full flex-col justify-end overflow-hidden">
            {/* LCP 사진: 다른 요청보다 먼저 받는다 (홈 맨 위 카드와 같은 방식. Next 16 의 priority 는 지원 중단) */}
            <Image
              src={imgSrc(hero.url, hero.width)}
              alt=""
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 640px) 100vw, 640px"
              // 인물 사진은 얼굴이 위쪽에 있다. 제목 블록 위로 얼굴이 남게 위쪽을 기준으로 자른다
              className="object-cover object-[50%_20%]"
            />
            <div className="relative bg-[linear-gradient(to_top,rgb(0_0_0/.72)_0%,rgb(0_0_0/.56)_calc(100%-96px),transparent_100%)] px-read pt-24 pb-6 text-white">
              <Badge tone="scrim">{categoryLabel}</Badge>
              <h1 className={`title mt-2 font-bold text-white ${longTitle ? "text-t3" : "text-st2"}`}>
                <Phrase text={translation.title} locale={locale} />
              </h1>
              <PhotoCredit media={hero} />
            </div>
          </figure>
        ) : (
          // 사진이 없으면 파스텔 메모 커버가 곧 제목
          <div className="px-gutter pt-4">
            <div className="overflow-hidden rounded-card shadow-card">
              <MemoCover
                title={<Phrase text={translation.title} locale={locale} />}
                sticker={categoryLabel}
                stamp={dateStamp(article.publishedAt)}
                style={coverStyle(slug, article.category)}
                size="hero"
                as="h1"
              />
            </div>
          </div>
        )}

        {/* 날짜 · 읽는 시간. '업데이트'는 띄우지 않는다 (article.updatedAt 은 본문을 고친 시각이 아니다) */}
        <p className="mt-5 px-read text-t7 tabular-nums text-ink-600">
          <Meta
            parts={[
              published && (
                <time dateTime={published.toISOString()}>
                  {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(published)}
                </time>
              ),
              t("readTime", { minutes: readMinutes(translation.body) }),
            ]}
          />
        </p>

        {/* article-summary 는 JSON-LD speakable 선택자 (#kp 와 함께) */}
        <p className="article-summary mt-3 px-read text-t5 font-medium text-ink-900">{translation.summary}</p>
        {/* 글에 나온 인물이 오늘 차트에 있으면 순위 칩 (없으면 아무것도 그리지 않는다) */}
        <EntityRankStrip entityIds={people.map((e) => e.id)} locale={locale} className="mt-4 px-read" />

        {event && <RelatedEventCard e={event} locale={locale} />}

        {keyPoints.length > 0 && (
          <section
            aria-labelledby="kp"
            className="mx-read mt-6 rounded-card p-5 text-on-tint"
            style={{ backgroundColor: "var(--surface-note)" }}
          >
            <h2 id="kp" className="text-t4 font-bold">
              {t("keyPoints")}
            </h2>
            <ol className="mt-3 space-y-2">
              {keyPoints.map((point, i) => (
                <li key={point} className="grid grid-cols-[20px_1fr] gap-2 text-t6">
                  <span className="font-bold tabular-nums text-on-tint-sub">{i + 1}</span>
                  {point}
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="article-body prose mt-8 max-w-none px-read dark:prose-invert">
          <ReactMarkdown>{translation.body}</ReactMarkdown>
        </div>

        {/* 본문 바로 뒤 참여 모듈: 국내 반응 → 독자 투표 → 반응 버튼. 모두 서버 HTML 에 글자로 들어간다 */}
        {netizen && <NetizenCard netizen={netizen} />}
        {poll && <PollCard poll={poll} locale={locale} anchorId="poll" articleId={article.id} shareUrl={current.url} />}
        <ReactionBar articleId={article.id} reactions={reactions} anchorId="reactions" commentHref="#comments" />

        {faq.length > 0 && (
          <section className="mt-10">
            <SectionHeader inset="read" title={t("faq")} />
            <div className="mx-read divide-y divide-line border-y border-line">
              {faq.map((item, i) => (
                <details key={item.q} className="faq group" open={i === 0}>
                  <summary className="flex min-h-14 cursor-pointer items-start gap-2 py-4 text-t5 font-semibold text-ink-900">
                    <span aria-hidden className="w-6 shrink-0 font-bold text-ink-600">
                      Q
                    </span>
                    <span className="flex-1">{item.q}</span>
                    <ChevronDownIcon className="mt-0.5 size-5 shrink-0 text-ink-400 transition-transform duration-200 ease-expo group-open:rotate-180" />
                  </summary>
                  <p className="pb-4 pl-8 text-t6 text-ink-700">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* '#이름' 칩: 글에 나온 인물·작품의 인물 페이지로 (진짜 <a href> 라 크롤러도 인물 페이지를 찾는다) */}
        {idolChips.length > 0 && (
          <ul aria-label={tIdol("inThisStory")} className="mt-8 flex flex-wrap gap-2 px-read">
            {idolChips.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/idol/${e.slug}`}
                  className="press inline-flex min-h-9 items-center rounded-full bg-fill-weak px-3 text-t7 font-semibold text-ink-700"
                >
                  #{displayName(e.names, locale, e.id)}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {newsSources.length > 0 && (
          <section className="mt-10">
            <SectionHeader inset="read" title={t("sources")} />
            <ul>
              {newsSources.map((source) => (
                <ListRow
                  key={source.id}
                  external
                  href={source.url}
                  inset="read"
                  titleWeight="medium"
                  title={publisherName(source.publisher, locale)}
                  sub={hostname(source.url)}
                />
              ))}
            </ul>
          </section>
        )}

        {/* 커뮤니티 글은 반응을 요약한 출처라 따로 두고, 링크에 nofollow 를 단다 (ListRow 는 rel 을 고정해서 직접 그린다) */}
        {communitySources.length > 0 && (
          <section className="mt-6">
            <SectionHeader inset="read" title={tEngage("reactionSources")} />
            <ul>
              {communitySources.map((source) => (
                <li
                  key={source.id}
                  className="relative [--row-inset:var(--spacing-read)] after:absolute after:right-0 after:bottom-0 after:left-[var(--row-inset)] after:h-px after:bg-line last:after:hidden"
                >
                  <a
                    href={source.url}
                    target="_blank"
                    rel="nofollow noopener"
                    className="press-row flex min-h-14 items-center gap-x-4 px-[var(--row-inset)] py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-t5 leading-row font-medium text-ink-900">
                        {publisherName(source.publisher, locale)}
                      </span>
                      <span className="mt-0.5 block text-t6 text-ink-600">{hostname(source.url)}</span>
                    </span>
                    <ExternalIcon className="size-4 shrink-0 text-ink-400" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* AI 고지는 사실대로: 공식 발표·한국 언론을 바탕으로 AI 로 쓰고 번역했다 (편집자 검토 문구는 넣지 않는다) */}
        <p className="mt-4 px-read text-t7 text-ink-600">{t("aiNotice")}</p>
        {contactEmail && (
          <a
            href={`mailto:${contactEmail}?subject=${encodeURIComponent(translation.title)}&body=${encodeURIComponent(url)}`}
            className="mx-read inline-flex min-h-11 items-center text-t7 font-semibold text-ink-700 underline underline-offset-4"
          >
            {t("correction")}
          </a>
        )}

        {/* 글 끝: 여행 준비(생활 글만) → 다른 섹션 가이드 → 광고. 광고와 제휴 상자 사이에 교차 레일이 들어가 바로 붙지 않는다 */}
        <div aria-hidden className="mt-10 h-4 bg-band" />
        {prep && (
          <AffiliateBox
            compact
            title={prep.title}
            locale={locale}
            placement="article-travel"
            items={prepRows.map(({ key, target }) => ({ target, label: prep.items[key].label, sub: prep.items[key].sub }))}
          />
        )}
        <CrossRail from="article" locale={locale} />

        <AdSlot label={t("ad")} slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE} />
        {coupang && <CoupangBanner id={coupang} label={t("ad")} disclosure={t("coupang")} disclosureKo={coupangKo} />}
      </article>

      {upNext && <UpNextCard item={upNext} title={tEngage("upNext")} />}

      <div aria-hidden className="mt-10 h-4 bg-band" />
      <Comments articleId={article.id} initialCount={comments} />
      <ViewPing articleId={article.id} slug={slug} />

      {/* 글 끝: 함께 읽기(같은 인물·카테고리) → 이번 주 인기 글. 섹션 제목은 같은 모양 하나 */}
      {(related.length > 0 || popular.length > 0) && (
        <>
          <div aria-hidden className="mt-10 h-4 bg-band" />
          {related.length > 0 && (
            // 썸네일 크기·큰 글자 규칙은 아래 '이번 주 인기 글'과 같게
            <section aria-labelledby="related" className="@container">
              <SectionHeader id="related" inset="read" title={t("related")} />
              <ul>
                {related.map((item) => (
                  <ListRow
                    key={item.slug}
                    href={`/news/${item.slug}`}
                    inset="read"
                    titleWeight="semibold"
                    left={
                      <span className={`block ${THUMB_LARGE_TEXT}`}>
                        <ArticleThumb item={item} size={48} />
                      </span>
                    }
                    title={
                      <span className="line-clamp-3">
                        <Phrase text={item.title} locale={locale} />
                      </span>
                    }
                    sub={
                      <span className="text-t7">
                        <Meta parts={[item.categoryLabel, itemTime(item)]} />
                      </span>
                    }
                  />
                ))}
              </ul>
            </section>
          )}
          <RankedArticles id="popular" title={t("popular")} items={popular} locale={locale} inset="read" />
        </>
      )}

      {/* 끝에 가까워지면 다음 글을 3편까지 이어 붙인다 (본문은 HTML 에 넣지 않는다. 크롤러는 위 'Up next' 링크로 간다).
          이어 붙이기가 끝난 자리(또는 꺼졌을 때)에 최신 글 6개 + 2쪽 링크. 서버 HTML 에는 늘 들어 있다 */}
      <NextArticleLoader locale={locale} current={current} candidates={nextRows.map((r) => r.slug)}>
        {more.length > 0 && (
          <section id="more-stories" aria-labelledby="more-stories-title" className="scroll-mt-20">
            <div aria-hidden className="mt-10 h-4 bg-band" />
            <SectionHeader id="more-stories-title" title={tEngage("moreStories")} />
            <div className="grid grid-cols-2 items-start gap-3 px-gutter">
              {more.map((item) => (
                <FeedCard key={item.slug} item={item} />
              ))}
            </div>
            <div className="mt-6 px-gutter">
              <Button href="/news/page/2" variant="neutral" size="l" block>
                {tEngage("moreStoriesLink")}
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </section>
        )}
      </NextArticleLoader>

      <ArticleActionBar
        locale={locale}
        article={current}
        upNextHref={upNext ? articlePath(locale, upNext.slug) : undefined}
      />
    </>
  );
}
