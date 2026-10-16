import { Prisma, prisma } from "@kmedia/db";

import { commonsFetch, fileFromUrl, stripHtml } from "../entities/images";
import { log } from "../log";
import { chunk } from "./metrics";

// 인물 페이지(/idol/{slug}) 주소와 대표 사진 CC 표기를 채운다 (주 1회, AI 없음)

// 영문 이름 → 주소 조각 ("Rosé" → "rose", "(G)I-DLE" → "g-i-dle")
export function kebab(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// slug 가 없는 인물에게 붙인다. 한 번 정한 주소는 바꾸지 않는다.
// 영문 이름이 없으면 q{번호}, 이미 있는 주소와 겹치면 뒤에 -q{번호}. 인지도 높은 쪽이 깨끗한 주소를 갖는다
export async function assignSlugs(entityIds: string[]): Promise<number> {
  if (entityIds.length === 0) return 0;
  const targets = await prisma.entity.findMany({
    where: { id: { in: [...new Set(entityIds)] }, slug: null },
    select: { id: true, en: true },
    orderBy: [{ sitelinks: "desc" }, { id: "asc" }],
  });
  if (targets.length === 0) return 0;
  const taken = new Set(
    (await prisma.entity.findMany({ where: { slug: { not: null } }, select: { slug: true } })).map((e) => e.slug!),
  );
  const rows = targets.map((e) => {
    const qid = e.id.toLowerCase();
    const base = (e.en && kebab(e.en)) || qid;
    const slug = taken.has(base) ? `${base}-${qid}` : base;
    taken.add(slug);
    return Prisma.sql`(${e.id}, ${slug})`;
  });
  for (const part of chunk(rows, 500)) {
    await prisma.$executeRaw`
      UPDATE "Entity" AS e SET slug = v.slug FROM (VALUES ${Prisma.join(part)}) AS v(id, slug)
      WHERE e.id = v.id AND e.slug IS NULL`;
  }
  return rows.length;
}

// 글 entities(JSON) 는 이름만 갖고 있다: { name: en ?? ko, koreanName: ko }. 사전에서 같은 이름의 인물을 찾는다
async function articleEntityIds(): Promise<string[]> {
  const articles = await prisma.article.findMany({ where: { status: "PUBLISHED" }, select: { entities: true } });
  const pairs = new Set<string>();
  for (const a of articles) {
    for (const e of (a.entities as { name?: string; koreanName?: string }[] | null) ?? []) {
      if (e.name) pairs.add(`${e.name}\u0000${e.koreanName ?? ""}`);
    }
  }
  const names = [...pairs].map((p) => p.split("\u0000")[0]!);
  const found = await prisma.entity.findMany({
    where: { OR: [{ en: { in: names } }, { ko: { in: names } }] },
    select: { id: true, en: true, ko: true },
  });
  return found
    .filter((e) => pairs.has(`${e.en ?? e.ko}\u0000${e.ko ?? ""}`))
    .map((e) => e.id);
}

// 최근 90일 스냅숏에 들어간 인물
async function snapshotEntityIds(): Promise<string[]> {
  const snapshots = await prisma.rankingSnapshot.findMany({
    where: { publishedAt: { gte: new Date(Date.now() - 90 * 86_400_000) } },
    select: { items: true },
  });
  return snapshots.flatMap((s) => ((s.items as { entityId: string }[] | null) ?? []).map((i) => i.entityId));
}

interface ImageInfo {
  descriptionurl?: string;
  width?: number;
  height?: number;
  extmetadata?: Record<string, { value: string } | undefined>;
}

// 공용 파일 정보를 40개씩 묶어 받는다 (요청 사이 간격·429 처리는 commonsFetch). 파일 이름 → 정보
async function commonsInfo(files: string[], iiprop: string): Promise<Map<string, ImageInfo>> {
  const byFile = new Map<string, ImageInfo>();
  for (const part of chunk([...new Set(files)], 40)) {
    const res = await commonsFetch(
      new URLSearchParams({
        action: "query",
        titles: part.map((f) => `File:${f}`).join("|"),
        prop: "imageinfo",
        iiprop,
        format: "json",
        formatversion: "2",
      }),
    );
    if (!res?.ok) {
      log.warn("entity-meta: commons request failed", { status: res?.status });
      continue;
    }
    const data = (await res.json()) as {
      query?: {
        normalized?: { from: string; to: string }[];
        pages?: { title: string; missing?: boolean; imageinfo?: ImageInfo[] }[];
      };
    };
    // API 는 "File:A_b.jpg" 를 "File:A b.jpg" 로 바꿔 돌려준다
    const original = new Map((data.query?.normalized ?? []).map((n) => [n.to, n.from]));
    for (const page of data.query?.pages ?? []) {
      const info = page.imageinfo?.[0];
      if (page.missing || !info) continue;
      byFile.set((original.get(page.title) ?? page.title).replace(/^File:/, ""), info);
    }
  }
  return byFile;
}

// 대표 사진(Entity.image) CC 표기: 저자·라이선스 이름과 링크·원본 링크·원본 크기. file 은 사진이 바뀌었는지 보려고 둔다
async function fillImageMeta(): Promise<number> {
  const entities = await prisma.entity.findMany({
    where: { slug: { not: null }, image: { not: null } },
    select: { id: true, image: true, imageMeta: true },
  });
  const stale = entities.filter((e) => (e.imageMeta as { file?: string } | null)?.file !== e.image);
  const info = await commonsInfo(stale.map((e) => e.image!), "url|size|extmetadata");
  const rows = stale.flatMap((e) => {
    const i = info.get(e.image!) ?? info.get(e.image!.replaceAll(" ", "_"));
    if (!i) return [];
    const meta = {
      file: e.image,
      author: stripHtml(i.extmetadata?.Artist?.value ?? "Unknown"),
      licenseName: stripHtml(i.extmetadata?.LicenseShortName?.value ?? "") || null,
      licenseUrl: stripHtml(i.extmetadata?.LicenseUrl?.value ?? "") || null,
      sourceUrl: i.descriptionurl ?? null,
      width: i.width ?? null,
      height: i.height ?? null,
    };
    return [Prisma.sql`(${e.id}, ${JSON.stringify(meta)})`];
  });
  for (const part of chunk(rows, 500)) {
    await prisma.$executeRaw`
      UPDATE "Entity" AS e SET "imageMeta" = v.meta::jsonb FROM (VALUES ${Prisma.join(part)}) AS v(id, meta)
      WHERE e.id = v.id`;
  }
  return rows.length;
}

// 글 사진(Media)의 원본 크기 (CLS 없이 자리를 잡고, 구조화 데이터 image 에 넣는다)
async function fillMediaSize(): Promise<number> {
  const media = await prisma.media.findMany({ where: { kind: "STOCK", width: null }, select: { id: true, url: true } });
  const fileOf = new Map(media.map((m) => [m.id, fileFromUrl(m.url)]));
  const info = await commonsInfo([...fileOf.values()].filter((f): f is string => Boolean(f)), "size");
  let updated = 0;
  for (const m of media) {
    const file = fileOf.get(m.id);
    const i = file ? (info.get(file) ?? info.get(file.replaceAll("_", " "))) : undefined;
    if (!i?.width || !i.height) continue;
    await prisma.media.update({ where: { id: m.id }, data: { width: i.width, height: i.height } });
    updated += 1;
  }
  return updated;
}

export async function syncEntityMeta(): Promise<void> {
  const ids = [...(await snapshotEntityIds()), ...(await articleEntityIds())];
  const slugs = await assignSlugs(ids);
  const imageMeta = await fillImageMeta();
  const mediaSize = await fillMediaSize();
  log.info("entity-meta: done", { candidates: new Set(ids).size, slugs, imageMeta, mediaSize });
}
