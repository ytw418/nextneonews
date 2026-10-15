import { prisma } from "@kmedia/db";

import { log } from "../log";
import { findEntities } from "./match";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "kmedia-entity-builder/0.1 (personal project)";

interface CommonsImage {
  url: string;
  credit: string;
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
  return { url: info.thumburl, credit: `Photo: ${artist}${license ? ` / ${license}` : ""} via Wikimedia Commons` };
}

// 기사에 나온 인물·그룹 중 사진이 있는 가장 유명한 항목의 사진을 대표 이미지로 붙인다
export async function attachImage(articleId: string): Promise<boolean> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { media: true, translations: { where: { locale: "en" }, select: { title: true } }, topic: true },
  });
  if (!article || article.media.length > 0) return false;

  const signal = article.topicId
    ? await prisma.signal.findFirst({ where: { topicId: article.topicId }, select: { title: true } })
    : null;
  const text = [signal?.title, article.topic?.keyword, article.translations[0]?.title].filter(Boolean).join(" ");
  const candidates = (await findEntities(text)).filter((e) => e.image && e.type !== "series");

  for (const entity of candidates.slice(0, 3)) {
    const image = await commonsImage(entity.image!);
    if (!image) continue;
    await prisma.media.create({ data: { articleId, url: image.url, kind: "STOCK", credit: image.credit } });
    log.info("image: attached", { articleId, entity: entity.en ?? entity.ko });
    return true;
  }
  return false;
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
