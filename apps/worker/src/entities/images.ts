import { type Entity, prisma } from "@kmedia/db";

import { log } from "../log";
import { findEntities } from "./match";
import { englishSubject, subjectIndex } from "./names";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "kmedia-entity-builder/0.1 (personal project)";

interface CommonsImage {
  url: string;
  credit: string;
  author: string;
  licenseName: string | null;
  licenseUrl: string | null;
  sourceUrl: string | null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// 위키미디어 공용 사진의 썸네일 URL 과 출처 표기(촬영자·라이선스)를 가져온다 (무료)
async function commonsImage(file: string): Promise<CommonsImage | null> {
  const params = new URLSearchParams({
    action: "query",
    titles: `File:${file}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1080",
    format: "json",
    origin: "*",
  });
  const res = await fetch(`${COMMONS_API}?${params}`, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          imageinfo?: {
            thumburl?: string;
            descriptionurl?: string;
            extmetadata?: Record<string, { value: string } | undefined>;
          }[];
        }
      >;
    };
  };
  const info = Object.values(data.query?.pages ?? {})[0]?.imageinfo?.[0];
  if (!info?.thumburl) return null;
  const artist = stripHtml(info.extmetadata?.Artist?.value ?? "Unknown");
  const license = stripHtml(info.extmetadata?.LicenseShortName?.value ?? "");
  return {
    url: info.thumburl,
    credit: `Photo: ${artist}${license ? ` / ${license}` : ""} via Wikimedia Commons`,
    author: artist,
    licenseName: license || null,
    licenseUrl: stripHtml(info.extmetadata?.LicenseUrl?.value ?? "") || null,
    sourceUrl: info.descriptionurl ?? null,
  };
}

// 사진 URL 에서 파일 이름을 되찾는다
// 썸네일: .../commons/thumb/a/ab/<파일>/1080px-<파일>, 원본: .../commons/a/ab/<파일>
function fileFromUrl(url: string): string | null {
  const match = url.match(/\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)/);
  return match ? decodeURIComponent(match[1]!) : null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 예전에 붙인 사진에 라이선스 링크·원본 링크를 채운다 (API 무료, AI 없음).
// 공용 API 는 한 번에 여러 파일을 물을 수 있어 40개씩 묶고, 요청 사이를 1초 띄운다
export async function backfillCredits(): Promise<void> {
  const media = await prisma.media.findMany({ where: { kind: "STOCK", sourceUrl: null }, select: { id: true, url: true } });
  const byFile = new Map<string, string[]>();
  for (const m of media) {
    const file = fileFromUrl(m.url);
    if (file) byFile.set(file, [...(byFile.get(file) ?? []), m.id]);
  }
  const files = [...byFile.keys()];
  let updated = 0;
  for (let i = 0; i < files.length; i += 40) {
    const chunk = files.slice(i, i + 40);
    const params = new URLSearchParams({
      action: "query",
      titles: chunk.map((f) => `File:${f}`).join("|"),
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      format: "json",
      formatversion: "2",
    });
    const res = await fetch(`${COMMONS_API}?${params}`, { headers: { "user-agent": USER_AGENT } });
    if (!res.ok) {
      log.warn("image: credits request failed", { status: res.status });
      await sleep(5000);
      continue;
    }
    const data = (await res.json()) as {
      query?: {
        normalized?: { from: string; to: string }[];
        pages?: {
          title: string;
          imageinfo?: { descriptionurl?: string; extmetadata?: Record<string, { value: string } | undefined> }[];
        }[];
      };
    };
    // API 는 "File:A_b.jpg" 를 "File:A b.jpg" 로 바꿔 돌려준다
    const original = new Map((data.query?.normalized ?? []).map((n) => [n.to, n.from]));
    for (const page of data.query?.pages ?? []) {
      const info = page.imageinfo?.[0];
      const file = (original.get(page.title) ?? page.title).replace(/^File:/, "");
      const ids = byFile.get(file);
      if (!info || !ids) continue;
      const author = stripHtml(info.extmetadata?.Artist?.value ?? "Unknown");
      const licenseName = stripHtml(info.extmetadata?.LicenseShortName?.value ?? "") || null;
      const licenseUrl = stripHtml(info.extmetadata?.LicenseUrl?.value ?? "") || null;
      const credit = `Photo: ${author}${licenseName ? ` / ${licenseName}` : ""} via Wikimedia Commons`;
      const { count } = await prisma.media.updateMany({
        where: { id: { in: ids } },
        data: { author, licenseName, licenseUrl, sourceUrl: info.descriptionurl ?? null, credit },
      });
      updated += count;
    }
    await sleep(1000);
  }
  log.info("image: credits backfilled", { updated, total: media.length });
}

// 기사 주인공(한국어 원문 제목 맨 앞에 나오는 인물·그룹)의 사진만 대표 이미지로 붙인다.
// "남창희♥아내 임신…아이유 축하" 처럼 뒤에 나온 유명인 사진이 붙으면 엉뚱한 사람 얼굴이 스캔들 제목과 묶인다.
// 영어 번역 제목이 있으면 거기서도 주인공인지 한 번 더 본다 (곁가지 인물 규칙은 names.ts)
const SUBJECT_WITHIN = 12;

export async function subjectEntity(title: string, enTitle?: string): Promise<Entity | null> {
  // 앞머리의 [단독]·[MD이슈] 와 '한강 아이유' 같은 따옴표 수식어는 주인공이 아니다
  const head = title.replace(/^\s*((\[[^\]]*\]|['‘"“][^'’"”]*['’"”])\s*)+/, "").trim();
  const found = (await findEntities(head)).filter((e) => e.image && e.type !== "series");
  let best: { entity: Entity; at: number } | null = null;
  for (const entity of found) {
    const at = subjectIndex(head, [entity.ko, entity.en, ...entity.aliases].filter((n): n is string => Boolean(n)));
    if (at !== -1 && at <= SUBJECT_WITHIN && (!best || at < best.at)) best = { entity, at };
  }
  if (!best) return null;
  // 한국어 제목만으로 고른 사람이 영어 제목에서 from·and 뒤에 있으면 사진을 붙이지 않는다 (다음 후보로 넘어가지 않는다)
  if (enTitle && !englishSubject(enTitle, [best.entity.en, ...best.entity.aliases])) return null;
  return best.entity;
}

// 기사에 나온 인물·그룹 중 주인공의 사진을 대표 이미지로 붙인다
export async function attachImage(articleId: string): Promise<boolean> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { media: true, translations: { where: { locale: "en" }, select: { title: true } }, topic: true },
  });
  if (!article || article.media.length > 0) return false;
  // 논란·사건 기사에는 얼굴 사진을 붙이지 않는다 (스캔들 제목과 얼굴이 묶이는 명예훼손·초상권 위험)
  if (article.riskTier !== "GREEN") return false;

  const signal = article.topicId
    ? await prisma.signal.findFirst({ where: { topicId: article.topicId }, select: { title: true } })
    : null;
  const subject = signal ? await subjectEntity(signal.title, article.translations[0]?.title) : null;
  if (!subject) return false;

  for (const entity of [subject]) {
    const image = await commonsImage(entity.image!);
    if (!image) continue;
    const { url, credit, author, licenseName, licenseUrl, sourceUrl } = image;
    await prisma.media.create({
      data: { articleId, url, kind: "STOCK", credit, author, licenseName, licenseUrl, sourceUrl },
    });
    log.info("image: attached", { articleId, entity: entity.en ?? entity.ko });
    return true;
  }
  return false;
}

// 이미 붙은 사진을 주인공 규칙으로 다시 본다. 주인공이 아니면 떼고, 주인공 사진이 있으면 바꿔 붙인다
export async function recheckImages(): Promise<void> {
  const media = await prisma.media.findMany({
    where: { kind: "STOCK" },
    select: {
      id: true,
      url: true,
      articleId: true,
      article: {
        select: { topicId: true, riskTier: true, translations: { where: { locale: "en" }, select: { title: true } } },
      },
    },
  });
  let removed = 0;
  let replaced = 0;
  for (const m of media) {
    const signal = m.article.topicId
      ? await prisma.signal.findFirst({ where: { topicId: m.article.topicId }, select: { title: true } })
      : null;
    const subject =
      signal && m.article.riskTier === "GREEN"
        ? await subjectEntity(signal.title, m.article.translations[0]?.title)
        : null;
    const current = fileFromUrl(m.url);
    if (subject?.image && current && subject.image.replaceAll(" ", "_") === current.replaceAll(" ", "_")) continue;
    await prisma.media.delete({ where: { id: m.id } });
    removed += 1;
    if (subject && (await attachImage(m.articleId))) replaced += 1;
  }
  log.info("images: recheck done", { checked: media.length, removed, replaced });
}

export async function backfillImages(): Promise<void> {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", media: { none: {} } },
    select: { id: true },
  });
  let attached = 0;
  for (const a of articles) {
    if (await attachImage(a.id)) attached += 1;
  }
  log.info("images: backfill done", { articles: articles.length, attached });
}
