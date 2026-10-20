import { Fragment } from "react";

import { Phrase } from "@/components/Phrase";

import { CoverArt, type CoverArtProps, type TypeCoverVariant } from "./CoverArt";

export type { TypeCoverVariant };

interface Props extends Omit<CoverArtProps, "title"> {
  title?: string; // grid·tile 만. hero 는 제목을 커버 밖 h1 로 둔다
  locale?: string; // 제목 CJK 줄바꿈
}

// 띄어쓰기 없는 긴 이름은 '@'·'/' 뒤에서 먼저 줄을 바꾼다. 144px 레일 카드에서 'KWANGYA@Seoul' 이 'KWANGYA@S / eoul' 로 끊겼다
const SOFT_BREAK = /(?<=[@/])/;

function CoverTitle({ title, locale }: { title: string; locale: string }) {
  return title.split(SOFT_BREAK).map((part, i) => (
    <Fragment key={i}>
      {i > 0 && <wbr />}
      <Phrase text={part} locale={locale} />
    </Fragment>
  ));
}

// 가이드 항목 커버(3D 아이콘·CC 사진, CoverArt)에 제목 줄바꿈을 입힌 서버용 래퍼.
// 제목은 일본어·중국어에서 구 단위로만 줄을 바꾼다
export function TypeCover({ title, locale = "en", ...rest }: Props) {
  return <CoverArt {...rest} title={title ? <CoverTitle title={title} locale={locale} /> : undefined} />;
}
