import type { AreaSlug } from "@/data/travel/types";
import type { CatalogSummary } from "@/data/types";

// 타이포 커버 유령 글자 규칙은 여기 하나 (docs/monetize/DESIGN.md §4-① 표). 상세·목록·저장함·가이드 허브가 모두 이것을 쓴다:
// 뷰티 = 브랜드 라틴 이니셜 1~2자, 여행 = 동네 첫 글자(ja·zh·ko 는 1자, 그 밖은 라틴 2자), 클리닉 = 회복 일수 "14d", 드라마 = 회차 "16".
// 요약 한 줄(CatalogSummary)만 있는 자리는 서버(data/catalog.ts)가 같은 규칙으로 채운 glyph 를 그대로 쓴다.
// 키릴·베트남어 이니셜은 쓰지 않는다 (라틴 브랜드명·동네 로마자)

export type GlyphSource =
  | { kind: "beauty"; brand: string }
  | { kind: "place"; area: AreaSlug; areaName: string; locale: string } // 동네 타일·명소 (명소는 자기 동네 글자)
  | { kind: "clinic"; downtimeDays: readonly [number, number] }
  | { kind: "drama"; episodes: number }
  | { kind: "name"; name: string; locale: string }; // 카탈로그 밖(아이돌 레일 등): 이름 첫 글자

// 요약 한 줄. glyph 는 data/catalog.ts 가 사실 값으로 채운다 (글처럼 사실 값이 없으면 제목으로)
export type GlyphSummary = Pick<CatalogSummary, "kind" | "title"> & { glyph?: string };

const ONE_CHAR_LOCALES: ReadonlySet<string> = new Set(["ja", "zh-TW", "zh-CN", "ko"]);
const CJK = /[぀-ヿ㐀-鿿가-힯]/;
const INITIALS_MAX = 2;

// 동네 로마자 2자 (라틴 문자 언어용)
const AREA_LATIN: Record<AreaSlug, string> = {
  seongsu: "SS",
  hongdae: "HD",
  myeongdong: "MD",
  "hannam-itaewon": "HN",
  "apgujeong-cheongdam": "AP",
  "bukchon-ikseon": "BC",
  yeouido: "YD",
  busan: "BS",
  jeju: "JJ",
};

// 브랜드 이니셜에서 빼는 짧은 말 (Beauty of Joseon → BJ, mise en scène → MS)
const BRAND_SKIP: ReadonlySet<string> = new Set(["of", "the", "en", "de", "&"]);

function brandGlyph(brand: string): string {
  const words = brand.split(/\s+/).filter((w) => w && !BRAND_SKIP.has(w.toLowerCase()));
  const letters = words.slice(0, INITIALS_MAX).map((w) => w.match(/[A-Za-z0-9]/)?.[0] ?? "");
  return letters.join("").toUpperCase() || brand.slice(0, 1).toUpperCase();
}

// 이름 첫 글자: 한중일 화면(또는 한중일 글자로 시작하는 이름)은 1자, 그 밖은 라틴 단어 이니셜 2자까지. 라틴 글자가 없으면 비운다
function nameGlyph(name: string, locale?: string): string {
  const text = name.trim();
  const first = Array.from(text)[0] ?? "";
  if ((locale !== undefined && ONE_CHAR_LOCALES.has(locale)) || CJK.test(first)) return first;
  return text
    .split(/[\s\-:·–/]+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, INITIALS_MAX)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function sourceGlyph(source: GlyphSource): string {
  switch (source.kind) {
    case "beauty":
      return brandGlyph(source.brand);
    case "place": {
      const first = Array.from(source.areaName.trim())[0];
      return ONE_CHAR_LOCALES.has(source.locale) && first ? first : AREA_LATIN[source.area];
    }
    case "clinic":
      return `${source.downtimeDays[1]}d`;
    case "drama":
      return String(source.episodes);
    case "name":
      return nameGlyph(source.name, source.locale);
  }
}

export function coverGlyph(source: GlyphSource | GlyphSummary): string {
  if ("title" in source) return source.glyph ?? nameGlyph(source.title);
  return sourceGlyph(source);
}
