import Image from "next/image";
import { useTranslations } from "next-intl";
import type { CSSProperties, ReactNode } from "react";

import { HeartIcon } from "@/components/icons";
import { MemoCover } from "@/components/MemoCover";
import { type CreditMedia, PhotoCredit } from "@/components/PhotoCredit";
import { Phrase } from "@/components/Phrase";
import { Badge } from "@/components/ui/Badge";
import { Meta } from "@/components/ui/Meta";
import { Link } from "@/i18n/navigation";
import { coverStyle } from "@/lib/cover";

export interface FeedItem {
  slug: string;
  title: string;
  summary?: string; // 맨 위 카드는 두 줄, 일본어 두 열 카드는 한 줄
  category: string;
  categoryLabel: string;
  timeAgo: string;
  locale: string;
  imageUrl?: string;
  credit?: CreditMedia; // 대표 사진 출처 (위키미디어면 저작자·라이선스·원본 링크)
  commentCount?: number;
  reactionTotal?: number;
}

export interface FeedCardProps {
  item: FeedItem;
  variant?: "lead" | "column";
  showCategory?: boolean; // 카테고리 페이지에서는 끈다 (선택된 칩이 이미 말한다)
  priority?: boolean; // 첫 화면에 보이는 맨 위 카드
  prefetch?: boolean; // 스크롤로 이어 붙인 카드는 미리 받지 않는다
  style?: CSSProperties;
}

// 말풍선 (icons.tsx 와 같은 1.8px 선)
function CommentIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M12 4.5c4.7 0 8.5 3 8.5 6.8s-3.8 6.7-8.5 6.7c-.9 0-1.8-.1-2.6-.3L5 19.5l1-3.4c-1.6-1.2-2.5-2.9-2.5-4.8 0-3.8 3.8-6.8 8.5-6.8z" />
    </svg>
  );
}

// 메타 줄 조각 '💬 3'. 숫자만 보이고 화면 낭독기는 '댓글 3개'로 읽는다. 0이면 넣지 않는다
function Count({ icon, n, label }: { icon: ReactNode; n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 tabular-nums">
      {icon}
      <span aria-hidden>{n}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function useCounts(item: FeedItem): ReactNode[] {
  const t = useTranslations("Feed");
  const comments = item.commentCount ?? 0;
  const reactions = item.reactionTotal ?? 0;
  return [
    comments > 0 && (
      <Count
        key="c"
        icon={<CommentIcon className="size-[1.15em]" />}
        n={comments}
        label={t("comments", { count: comments })}
      />
    ),
    reactions > 0 && (
      <Count
        key="r"
        icon={<HeartIcon className="size-[1.1em]" />}
        n={reactions}
        label={t("reactions", { count: reactions })}
      />
    ),
  ].filter(Boolean);
}

// 사진 왼쪽 위 카테고리 칩 (작게). 흰 사진에서도 읽히는 scrim
function CategoryChip({ label }: { label: string }) {
  return (
    <Badge tone="scrim" className="pointer-events-none absolute top-2 left-2 min-h-5! px-1.5! text-st12!">
      {label}
    </Badge>
  );
}

// 포토카드 한 장. 공식 이미지가 있으면 사진 + 제목, 없으면 메모 커버가 곧 제목이다.
// lead 는 피드 맨 위 한 장(가로 꽉 차게), column 은 그 아래 두 열
export function FeedCard({ item, variant = "column", showCategory = true, priority, prefetch, style }: FeedCardProps) {
  const counts = useCounts(item);
  const lead = variant === "lead";
  const cover = coverStyle(item.slug, item.category);
  const href = `/news/${item.slug}`;

  if (!item.imageUrl) {
    // 메모 카드는 메모 한 장이 전부다: 도장 자리에 '3시간 전', 오른쪽 아래에 카테고리 배지.
    // 댓글·반응이 있으면 메모 밑에 한 줄. 테이프가 카드 위로 삐져나오게 잘라 내지 않는다 (모서리는 메모가 직접 둥글린다)
    return (
      <Link href={href} prefetch={prefetch} className="press-soft block" style={style}>
        <MemoCover
          title={item.title}
          sticker={item.categoryLabel}
          stamp={item.timeAgo}
          locale={item.locale}
          style={cover}
          size={lead ? "lead" : "card"}
          className="rounded-card shadow-card"
        />
        {counts.length > 0 && (
          <p className={`pt-1.5 text-t7 text-ink-600 ${lead ? "px-4" : "px-3"}`}>
            <Meta parts={counts} />
          </p>
        )}
      </Link>
    );
  }

  // 카테고리는 사진 위 칩이 말하므로 메타 줄은 '3시간 전 · 💬 2 · ♡ 5'
  const meta = (
    <p className={`pt-1 text-t7 text-ink-600 ${lead ? "px-4 pb-4" : "px-3 pb-3"}`}>
      <Meta parts={[item.timeAgo, ...counts]} />
    </p>
  );

  if (lead) {
    // 맨 위 큰 사진에는 출처 표기(링크 둘)가 들어가서 카드 전체를 <a> 로 감쌀 수 없다.
    // 제목 링크를 카드 전체로 늘리고(after:inset-0), 출처 링크만 그 위로 올린다
    return (
      <div className="press-soft relative overflow-hidden rounded-card bg-card shadow-card" style={style}>
        <figure className="relative aspect-video">
          <Image
            src={item.imageUrl}
            alt=""
            fill
            unoptimized
            loading={priority ? "eager" : undefined}
            fetchPriority={priority ? "high" : undefined}
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover object-[50%_20%]"
          />
          {showCategory && <CategoryChip label={item.categoryLabel} />}
          {item.credit && (
            <div className="absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(to_top,rgb(0_0_0/.6),transparent)] px-3 pt-6 pb-2">
              <PhotoCredit media={item.credit} className="" />
            </div>
          )}
        </figure>
        <p className="title px-4 pt-3 text-t4 font-bold text-ink-900">
          <Link href={href} prefetch={prefetch} className="after:absolute after:inset-0">
            <Phrase text={item.title} locale={item.locale} />
          </Link>
        </p>
        {item.summary && <p className="line-clamp-2 px-4 pt-1 text-t6 text-ink-700">{item.summary}</p>}
        {meta}
      </div>
    );
  }

  return (
    <Link href={href} prefetch={prefetch} className="press-soft block" style={style}>
      <div className="overflow-hidden rounded-card bg-card shadow-card">
        <div className={`relative ${cover.ratio}`}>
          <Image
            src={item.imageUrl}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 45vw, 300px"
            className="object-cover"
          />
          {showCategory && <CategoryChip label={item.categoryLabel} />}
        </div>
        {/* 4줄 자르기는 안전망. 파이프라인의 언어별 제목 길이 제한이 보통 4줄 안에 맞춘다 */}
        <p className="title line-clamp-4 px-3 pt-3 text-t6 leading-row font-bold text-ink-900">
          <Phrase text={item.title} locale={item.locale} />
        </p>
        {/* 일본어 독자는 한 화면에 글이 많은 쪽을 좋아해서(PRD 9.2) 두 열 카드에도 요약 한 줄 */}
        {item.locale === "ja" && item.summary && (
          <p className="line-clamp-1 px-3 pt-1 text-t7 text-ink-700">{item.summary}</p>
        )}
        {meta}
      </div>
    </Link>
  );
}
