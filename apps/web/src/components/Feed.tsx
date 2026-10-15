import { FeedCard, type FeedItem } from "@/components/FeedCard";

// 2열 폭포수(masonry). 카드 높이가 제각각이라 CSS columns 로 쌓는다
export function Feed({ items, emptyLabel }: { items: FeedItem[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="px-4 py-16 text-center text-muted">{emptyLabel}</p>;
  }
  return (
    <div className="columns-2 gap-3 px-3">
      {items.map((item, i) => (
        <FeedCard key={item.slug} item={item} index={i} featured={i === 0} />
      ))}
    </div>
  );
}
