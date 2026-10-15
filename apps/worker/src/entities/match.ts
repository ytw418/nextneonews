import { type Entity, prisma } from "@kmedia/db";

// 제목·본문에서 사전에 있는 인물·그룹·드라마를 찾는다 (AI 없이 문자열 매칭)
let cache: Entity[] | undefined;

async function dictionary(): Promise<Entity[]> {
  cache ??= await prisma.entity.findMany();
  return cache;
}

const LATIN = /^[A-Za-z0-9 .&'-]+$/;

function minLength(e: Entity): number {
  // 드라마 제목은 "사랑", "가족" 같은 흔한 단어와 겹치기 쉬워 더 길게 요구한다
  return e.type === "series" ? 4 : 2;
}

function matches(text: string, name: string | null, min: number): boolean {
  if (!name || name.length < min) return false;
  if (LATIN.test(name)) {
    // 영문 이름(IVE, IU 등)은 단어 경계로만 매칭
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`).test(text);
  }
  // 한글 이름은 앞 글자가 한글이면 다른 이름의 일부다 ("이지혜" 안의 "지혜"). 뒤에는 조사가 붙어도 된다
  let from = text.indexOf(name);
  while (from !== -1) {
    if (from === 0 || !/[\uac00-\ud7a3]/.test(text[from - 1]!)) return true;
    from = text.indexOf(name, from + 1);
  }
  return false;
}

export async function findEntities(text: string): Promise<Entity[]> {
  const found = (await dictionary()).filter((e) => matches(text, e.ko, minLength(e)) || matches(text, e.en, 2));
  // 짧은 이름이 긴 이름에 포함되는 경우(예: "아이유" 안의 "유")를 줄이려고 긴 이름·유명한 순으로
  return found.sort((a, b) => b.sitelinks - a.sitelinks || (b.ko?.length ?? 0) - (a.ko?.length ?? 0));
}
