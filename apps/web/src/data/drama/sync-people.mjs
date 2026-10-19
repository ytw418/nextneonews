#!/usr/bin/env node
// 가이드 카탈로그가 가리키는 인물(드라마 출연 cast.entityId · 명소 related.entityIds)의 인물 사전(Entity) 사본을 people.json 으로 만든다.
// 화면은 이 사본만 읽고 DB 를 부르지 않는다 — 가이드 페이지가 빌드·재생성 때 Neon 을 깨우지 않게 (docs/predeploy/cost.md §7-D).
// 카탈로그에 인물을 더했거나 인물 페이지(/idol/slug)가 새로 생겼을 때 다시 돌린다 (운영 DB 를 읽으면 운영 slug 그대로):
//   cd apps/web && npx dotenv run -q -f ../../.env -- node src/data/drama/sync-people.mjs
// 사실 파일(items.ts)은 Node 의 타입 지우기로 바로 읽는다 (scripts/check-catalog.mjs 와 같다)
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

import pg from "pg";

const here = fileURLToPath(new URL(".", import.meta.url));
const OUT = `${here}people.json`;

const { DRAMA_ITEMS } = await import(pathToFileURL(`${here}items.ts`).href);
const { TRAVEL_ITEMS } = await import(pathToFileURL(`${here}../travel/items.ts`).href);

const ids = [
  ...new Set([
    ...DRAMA_ITEMS.flatMap((d) => d.cast.flatMap((c) => (c.entityId ? [c.entityId] : []))),
    ...TRAVEL_ITEMS.flatMap((p) => p.related?.entityIds ?? []),
  ]),
].sort();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL 이 없다 (위 주석의 dotenv 명령으로 돌린다)");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const { rows } = await client.query(
  'select id, slug, en, ko, ja, "zhHant" from "Entity" where id = any($1::text[]) order by id',
  [ids],
);
await client.end();

// 값이 없는 칸은 뺀다 (화면은 이름이 없으면 카탈로그의 영문 이름, slug 가 없으면 링크 없이 둔다)
const people = Object.fromEntries(
  rows.map((r) => [
    r.id,
    Object.fromEntries(Object.entries({ slug: r.slug, en: r.en, ko: r.ko, ja: r.ja, zhHant: r.zhHant }).filter(([, v]) => v)),
  ]),
);
writeFileSync(OUT, `${JSON.stringify(people, null, 2)}\n`);

const missing = ids.filter((id) => !people[id]);
console.log(`인물 ${rows.length}/${ids.length}명 (인물 페이지 ${rows.filter((r) => r.slug).length}명) → ${OUT}`);
if (missing.length > 0) console.log(`사전에 없는 Q-id: ${missing.join(", ")}`);
