import { Prisma, prisma } from "@kmedia/db";

import { log } from "../log";

// 위키데이터 SPARQL (무료). 이름 표기·해외 인지도(위키백과 언어 수)·대표 사진(P18)을 한 번에 받는다
const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "kmedia-entity-builder/0.1 (personal project; contact via site)";

const LABELS = `
  OPTIONAL { ?item wdt:P21 ?sex }
  OPTIONAL { ?item wdt:P31 ?gcls FILTER(?gcls IN (wd:Q641066, wd:Q216337)) }
  OPTIONAL { ?item rdfs:label ?ko FILTER(LANG(?ko) = "ko") }
  OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?ja FILTER(LANG(?ja) = "ja") }
  OPTIONAL { ?item rdfs:label ?zhtw FILTER(LANG(?zhtw) = "zh-tw") }
  OPTIONAL { ?item rdfs:label ?zhhant FILTER(LANG(?zhhant) = "zh-hant") }
  OPTIONAL { ?item rdfs:label ?zh FILTER(LANG(?zh) = "zh") }
  OPTIONAL { ?item wdt:P18 ?img }`;

const SELECT = "SELECT ?item ?sl ?ko ?en ?ja ?zhtw ?zhhant ?zh ?img ?human ?sex ?gcls WHERE {";

// 앞 쿼리의 종류가 이긴다: 그룹 → K-pop 가수 → 배우 → 일반 가수 → 드라마
// (가수 경력이 있는 배우가 "가수" 로 잡혀 K-POP 으로 분류되지 않게 배우를 일반 가수보다 앞에 둔다)
const QUERIES: { name: string; type: (row: Row) => string; sparql: string }[] = [
  {
    // 한국 출신 음악 그룹·걸그룹·보이그룹 (장르가 K-pop 으로 안 적힌 그룹도 잡는다. 예: IVE)
    name: "groups",
    type: () => "group",
    sparql: `${SELECT}
      VALUES ?cls { wd:Q215380 wd:Q641066 wd:Q216337 }
      ?item wdt:P31 ?cls ; wdt:P495 wd:Q884 ; wikibase:sitelinks ?sl . FILTER(?sl >= 5)
      ${LABELS} }`,
  },
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
    // 한국 국적 가수
    name: "singers",
    type: () => "singer",
    sparql: `${SELECT}
      ?item wdt:P27 wd:Q884 ; wdt:P106 wd:Q177220 ; wikibase:sitelinks ?sl . FILTER(?sl >= 8)
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
type Row = Partial<Record<"item" | "sl" | "ko" | "en" | "ja" | "zhtw" | "zhhant" | "zh" | "img" | "human" | "sex" | "gcls", Binding>>;

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

// 위키데이터에서 전부 받아 메모리에서 합친 뒤 500개씩 묶어 저장한다.
// 한 줄씩 upsert 하면 원격 DB(Actions 미국 ↔ Neon 싱가포르)에서 수십 분 걸린다
export async function buildEntities(): Promise<void> {
  const all = new Map<string, EntityRow>();
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
      // 앞 쿼리(그룹·가수)에서 정한 종류를 뒤 쿼리가 덮지 않는다
      if (all.has(id)) continue;
      all.set(id, {
        id,
        type: q.type(row),
        ko: row.ko?.value ?? null,
        en: row.en?.value ?? null,
        ja: row.ja?.value ?? null,
        zhHant: row.zhtw?.value ?? row.zhhant?.value ?? row.zh?.value ?? null,
        sitelinks: Number(row.sl?.value ?? 0),
        image: fileName(row.img?.value),
        gender: genderOf(row),
        aliases: [],
      });
    }
    log.info(`entities: ${q.name}`, { count: merged.size });
  }

  const aliases = await fetchAliases([...all.keys()]);
  for (const [id, list] of aliases) all.get(id)!.aliases = list;

  // 500개씩 "있으면 고치고 없으면 넣기" 를 한 번에 보낸다. 위키데이터에서 빠진 항목만 지운다
  const data = [...all.values()];
  for (let i = 0; i < data.length; i += 500) {
    const rows = data
      .slice(i, i + 500)
      .map(
        (e) =>
          Prisma.sql`(${e.id}, ${e.type}, ${e.ko}, ${e.en}, ${e.ja}, ${e.zhHant}, ${e.aliases}::text[], ${e.sitelinks}, ${e.image}, ${e.gender}, now())`,
      );
    await prisma.$executeRaw`
      INSERT INTO "Entity" (id, type, ko, en, ja, "zhHant", aliases, sitelinks, image, gender, "updatedAt")
      VALUES ${Prisma.join(rows)}
      ON CONFLICT (id) DO UPDATE SET type = EXCLUDED.type, ko = EXCLUDED.ko, en = EXCLUDED.en, ja = EXCLUDED.ja,
        "zhHant" = EXCLUDED."zhHant", aliases = EXCLUDED.aliases, sitelinks = EXCLUDED.sitelinks,
        image = EXCLUDED.image, gender = EXCLUDED.gender, "updatedAt" = now()`;
  }
  const { count: removed } = await prisma.entity.deleteMany({ where: { id: { notIn: data.map((e) => e.id) } } });
  log.info("entities: done", { total: data.length, withAliases: aliases.size, removed });
}

// 남녀 차트용 성별: 사람은 P21(남 Q6581097·여 Q6581072), 그룹은 걸그룹 Q641066·보이그룹 Q216337
function genderOf(row: Row): string | null {
  const id = (row.sex?.value ?? row.gcls?.value)?.split("/").pop();
  if (id === "Q6581097" || id === "Q216337") return "M";
  if (id === "Q6581072" || id === "Q641066") return "F";
  return null;
}

interface EntityRow {
  gender: string | null;
  id: string;
  type: string;
  ko: string | null;
  en: string | null;
  ja: string | null;
  zhHant: string | null;
  sitelinks: number;
  image: string | null;
  aliases: string[];
}

// 한국어 별칭을 300개씩 묶어 받는다 (위키데이터 skos:altLabel). "제니 김" → ["제니", ...]
async function fetchAliases(ids: string[]): Promise<Map<string, string[]>> {
  const byId = new Map<string, string[]>();
  for (let i = 0; i < ids.length; i += 300) {
    const chunk = ids.slice(i, i + 300);
    const rows = (await runQuery(
      `SELECT ?item ?alias WHERE { VALUES ?item { ${chunk.map((id) => `wd:${id}`).join(" ")} }
        ?item skos:altLabel ?alias FILTER(LANG(?alias) = "ko") }`,
    )) as (Row & { alias?: Binding })[];
    for (const row of rows) {
      const id = row.item?.value.split("/").pop();
      const alias = row.alias?.value.trim();
      if (id && alias) byId.set(id, [...new Set([...(byId.get(id) ?? []), alias])].slice(0, 10));
    }
  }
  return byId;
}
