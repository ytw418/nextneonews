import { GUIDE_INDEX_LOCALES } from "@/lib/guide-seo";

// 가이드 상세(명소·동네·시술·드라마)를 빌드 때 만들어 두는 주소: 검색에 내는 언어(en·ja·zh-TW) × 항목.
// 나머지 6개 언어는 처음 요청 때 만들어 다음 배포까지 그대로 쓴다(revalidate=false). 화면이 DB 를 읽지 않으니 그때도 DB 를 깨우지 않는다.
// 언어도 여기서 정한다: 부모 [locale] 의 언어마다 불리는데, 어떤 언어에서 빈 목록을 돌려주면 Next 가 그 언어를 slug 없는 채로
// 넘겨 이 경로 전체를 빌드 때 하나도 만들지 않는다(build/static-paths/app.js hadAllParamsGenerated). 그래서 늘 같은 전체 목록을 돌려주고 중복은 Next 가 거른다
export function guidePrerender<K extends string>(key: K, values: readonly string[]): ({ locale: string } & Record<K, string>)[] {
  return GUIDE_INDEX_LOCALES.flatMap((locale) =>
    values.map((value) => ({ locale, [key]: value }) as { locale: string } & Record<K, string>),
  );
}
