import { Phrase } from "@/components/Phrase";

import { CoverArt, type CoverArtProps, type TypeCoverVariant } from "./CoverArt";

export type { TypeCoverVariant };

interface Props extends Omit<CoverArtProps, "title"> {
  title?: string; // grid·tile 만. hero 는 제목을 커버 밖 h1 로 둔다
  locale?: string; // 제목 CJK 줄바꿈
}

// 사진 없는 제품·명소·시술·드라마 커버: 틴트 면 + 오른쪽 아래 밖으로 잘린 큰 글자 + 작은 라벨.
// 유령 글자는 장식이라 화면 읽기에서 빠지고, 제목·라벨은 읽힌다. 제목은 일본어·중국어에서 구 단위로만 줄을 바꾼다
export function TypeCover({ title, locale = "en", ...rest }: Props) {
  return <CoverArt {...rest} title={title ? <Phrase text={title} locale={locale} /> : undefined} />;
}
