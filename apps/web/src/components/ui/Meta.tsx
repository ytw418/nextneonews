import { Fragment, type ReactNode } from "react";

// 메타 줄 'K-POP · 3시간 전', '컴백 · 서울 · 3개 발매'.
// 구분점은 앞 조각 끝에 붙이고(줄바꿈 없는 공백), 조각은 통째로 다음 줄로 넘긴다 (inline-block).
// 그래서 줄이 '·'로 시작하거나 '3 / 작품'처럼 갈라지지 않는다. 조각 하나가 줄보다 길 때만 그 안에서 줄을 바꾼다
export function Meta({ parts }: { parts: ReactNode[] }) {
  const shown = parts.filter((part) => part !== null && part !== undefined && part !== false && part !== "");
  return (
    <>
      {shown.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="inline-block max-w-full">
            {part}
            {i < shown.length - 1 && " ·"}
          </span>
        </Fragment>
      ))}
    </>
  );
}

// 'IVE · ILLIT · RIIZE' 처럼 이름 안의 구분점이 줄 맨 앞에 오지 않게 앞 단어에 붙인다
export function keepDots(text: string): string {
  return text.replaceAll(" · ", " · ");
}
