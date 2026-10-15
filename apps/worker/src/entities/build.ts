import { prisma } from "@kmedia/db";

import { log } from "../log";

// 위키데이터 SPARQL (무료). 이름 표기·해외 인지도(위키백과 언어 수)·대표 사진(P18)을 한 번에 받는다
const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "kmedia-entity-builder/0.1 (personal project; contact via site)";

const LABELS = `
  OPTIONAL { ?item rdfs:label ?ko FILTER(LANG(?ko) = "ko") }
  OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?ja FILTER(LANG(?ja) = "ja") }
  OPTIONAL { ?item rdfs:label ?zhtw FILTER(LANG(?zhtw) = "zh-tw") }
  OPTIONAL { ?item rdfs:label ?zhhant FILTER(LANG(?zhhant) = "zh-hant") }
  OPTIONAL { ?item rdfs:label ?zh FILTER(LANG(?zh) = "zh") }
  OPTIONAL { ?item wdt:P18 ?img }`;

const SELECT = "SELECT ?item ?sl ?ko ?en ?ja ?zhtw ?zhhant ?zh ?img ?human WHERE {";

const QUERIES: { name: string; type: (row: Row) => string; sparql: string }[] = [
  {
    // K-pop 장르로 분류된 그룹·솔로 가수
    name: "kpop",
    type: (row) => (row.human ? "singer" : "group"),
    sparql: `${SELECT}
      ?item wdt:P136 wd:Q213665 ; wikibase:sitelinks ?sl . FILTER(?sl >= 5)
      OPTIONAL { ?item wdt:P31 wd:Q5 . BIND(true AS ?human) }
      ${LABELS} }`,
  },
  {
    // 한국 국적 배우
    name: "actors",
    type: () => "actor",
    sparql: `${SELECT}
      ?item wdt:P27 wd:Q884 ; wdt:P106 ?occ ; wikibase:sitelinks ?sl .
      VALUES ?occ { wd:Q33999 wd:Q10800557 wd:Q10798782 } FILTER(?sl >= 6)
      BIND(true AS ?human)
      ${LABELS} }`,
  },
  {
    // 한국 드라마
    name: "dramas",
    type: () => "series",
    sparql: `${SELECT}
      ?item wdt:P31 wd:Q5398426 ; wdt:P495 wd:Q884 ; wikibase:sitelinks ?sl . FILTER(?sl >= 5)
      ${LABELS} }`,
  },
];

interface Binding {
  value: string;
}
type Row = Partial<Record<"item" | "sl" | "ko" | "en" | "ja" | "zhtw" | "zhhant" | "zh" | "img" | "human", Binding>>;

async function runQuery(sparql: string): Promise<Row[]> {
  const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(sparql)}`, {
    headers: { accept: "application/sparql-results+json", "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) {
    throw new Error(`wikidata ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as { results: { bindings: Row[] } };
  return data.results.bindings;
}

// 커먼즈 파일 URL → 파일 이름 ("Special:FilePath/IU_2019.jpg" → "IU_2019.jpg")
function fileName(url: string | undefined): string | null {
  if (!url) return null;
  return decodeURIComponent(url.split("/").pop() ?? "") || null;
}

export async function buildEntities(): Promise<void> {
  let total = 0;
  for (const q of QUERIES) {
    const rows = await runQuery(q.sparql);
    // OPTIONAL 라벨 때문에 한 항목이 여러 줄로 올 수 있다 → 항목별로 합친다
    const merged = new Map<string, Row>();
    for (const row of rows) {
      const id = row.item?.value.split("/").pop();
      if (!id) continue;
      const prev = merged.get(id) ?? {};
      merged.set(id, { ...row, ...Object.fromEntries(Object.entries(prev).filter(([, v]) => v)) });
    }

    for (const [id, row] of merged) {
      const data = {
        type: q.type(row),
        ko: row.ko?.value ?? null,
        en: row.en?.value ?? null,
        ja: row.ja?.value ?? null,
        zhHant: row.zhtw?.value ?? row.zhhant?.value ?? row.zh?.value ?? null,
        sitelinks: Number(row.sl?.value ?? 0),
        image: fileName(row.img?.value),
      };
      await prisma.entity.upsert({ where: { id }, create: { id, ...data }, update: data });
    }
    total += merged.size;
    log.info(`entities: ${q.name}`, { count: merged.size });
  }
  log.info("entities: done", { total });
}
