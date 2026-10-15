import { type Entity, prisma } from "@kmedia/db";

import { nameMatches } from "./names";

// 제목·본문에서 사전에 있는 인물·그룹·드라마를 찾는다 (AI 없이 문자열 매칭, 규칙은 names.ts)
let cache: Entity[] | undefined;

async function dictionary(): Promise<Entity[]> {
  cache ??= await prisma.entity.findMany();
  return cache;
}

export async function findEntities(text: string): Promise<Entity[]> {
  const found = (await dictionary()).filter(
    (e) => nameMatches(text, e.ko, e.type) || nameMatches(text, e.en, e.type),
  );
  // 해외 인지도(위키 언어 수) 높은 순
  return found.sort((a, b) => b.sitelinks - a.sitelinks);
}
