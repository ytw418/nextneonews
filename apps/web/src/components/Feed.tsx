import type { ReactNode } from "react";

import { FeedCard, type FeedItem } from "@/components/FeedCard";
import { coverStyle } from "@/lib/cover";

interface Props {
  items: FeedItem[];
  showCategory?: boolean;
  empty: ReactNode; // 글이 없을 때 (EmptyMemo)
}

// 카드 높이 어림 (열 폭 = 1). 사진 카드는 그림 + 제목·메타, 메모 카드는 메모 한 장
function estimate(item: FeedItem): number {
  return coverStyle(item.slug, item.category).aspect + (item.imageUrl ? 0.55 : 0);
}

// 맨 위 한 장(lead)은 가로 꽉 차게, 나머지는 두 열.
// CSS columns 는 2번째 글을 화면 아래로 밀어 내서, 카드를 하나씩 더 짧은 열에 넣는다 (최신 글이 왼쪽 위부터 읽힌다).
// 글자가 커져(약 120%·xxLarge·사파리 aA 135%) 열이 17.5rem 보다 좁아지면 한 열로, order 로 최신순을 지킨다
export function Feed({ items, showCategory = true, empty }: Props) {
  if (items.length === 0) return empty;

  const [lead, ...rest] = items;
  const left: ReactNode[] = [];
  const right: ReactNode[] = [];
  let leftH = 0;
  let rightH = 0;
  rest.forEach((item, index) => {
    const card = (
      <FeedCard key={item.slug} item={item} showCategory={showCategory} style={{ order: index }} />
    );
    if (leftH <= rightH) {
      left.push(card);
      leftH += estimate(item);
    } else {
      right.push(card);
      rightH += estimate(item);
    }
  });

  return (
    <>
      <div className="px-gutter">
        <FeedCard item={lead!} variant="lead" showCategory={showCategory} priority />
      </div>
      {rest.length > 0 && (
        <div className="@container px-gutter pt-3">
          <div className="grid grid-cols-2 items-start gap-3 @max-[17.5rem]:flex @max-[17.5rem]:flex-col">
            <div className="flex flex-col gap-3 @max-[17.5rem]:contents">{left}</div>
            <div className="flex flex-col gap-3 @max-[17.5rem]:contents">{right}</div>
          </div>
        </div>
      )}
    </>
  );
}
