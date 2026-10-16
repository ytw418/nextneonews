import { Fragment, type ReactNode } from "react";

import { FeedCard, type FeedItem } from "@/components/FeedCard";
import { FeedGrid, FeedLoader, type Paging } from "@/components/FeedLoader";
import { type Placed, splitColumns } from "@/lib/feed";

interface Props {
  items: FeedItem[];
  showCategory?: boolean;
  lead?: boolean; // 맨 위 한 장을 크게 (쪽 번호 화면은 두 열만)
  // 두 열 카드 n장 뒤에 가로 꽉 차게 끼우는 모듈 (홈: 6 = 주간 투표, 12 = 랭킹 카드). 카드가 그보다 적으면 넣지 않는다
  slots?: Record<number, ReactNode>;
  paging?: Paging; // 있으면 끝에서 다음 쪽을 이어 붙이고, '더 보기'·이전/다음 링크를 둔다
  empty: ReactNode; // 글이 없을 때 (EmptyMemo)
}

// 맨 위 한 장(lead)은 가로 꽉 차게, 나머지는 두 열.
// CSS columns 는 2번째 글을 화면 아래로 밀어 내서, 카드를 하나씩 더 짧은 열에 넣는다 (최신 글이 왼쪽 위부터 읽힌다).
// 글자가 커져(약 120%·xxLarge·사파리 aA 135%) 열이 17.5rem 보다 좁아지면 한 열로, order 로 최신순을 지킨다.
// 마지막 두 열은 FeedLoader 가 그려서, 스크롤로 받은 다음 쪽 카드를 같은 열 끝에 이어 붙인다
export function Feed({ items, showCategory = true, lead: withLead = true, slots = {}, paging, empty }: Props) {
  if (items.length === 0) return empty;

  const [lead, rest] = withLead ? [items[0], items.slice(1)] : [undefined, items];
  const cards = (placed: Placed[]) =>
    placed.map(({ item, order }) => (
      <FeedCard key={item.slug} item={item} showCategory={showCategory} style={{ order }} />
    ));

  // 슬롯 자리에서 두 열을 끊는다 (내용이 없는 슬롯은 건너뛴다)
  const cuts = Object.keys(slots)
    .map(Number)
    .filter((n) => n > 0 && n <= rest.length && slots[n] != null && slots[n] !== false)
    .sort((a, b) => a - b);
  const segments: { items: FeedItem[]; slot?: ReactNode }[] = [];
  let start = 0;
  for (const cut of cuts) {
    segments.push({ items: rest.slice(start, cut), slot: slots[cut] });
    start = cut;
  }
  const tail = splitColumns(rest.slice(start));

  return (
    <>
      {lead && (
        <div className="px-gutter">
          <FeedCard item={lead} variant="lead" showCategory={showCategory} priority />
        </div>
      )}
      {segments.map(({ items: part, slot }, i) => {
        const { left, right } = splitColumns(part);
        return (
          <Fragment key={i}>
            {part.length > 0 && <FeedGrid left={cards(left)} right={cards(right)} />}
            <div className="px-gutter pt-3">{slot}</div>
          </Fragment>
        );
      })}
      {paging ? (
        <FeedLoader
          left={cards(tail.left)}
          right={cards(tail.right)}
          end={tail.end}
          slugs={items.map((item) => item.slug)}
          showCategory={showCategory}
          paging={paging}
        />
      ) : (
        tail.end.order > 0 && <FeedGrid left={cards(tail.left)} right={cards(tail.right)} />
      )}
    </>
  );
}
