import { useTranslations } from "next-intl";

import { ChevronRightIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { pagePath } from "@/lib/feed";

interface Props {
  category?: string; // 카테고리 slug (없으면 전체 최신)
  prev?: number; // 이전 쪽 번호 (쪽 번호 화면에서만)
  next?: number; // 다음 쪽 번호 (마지막 쪽이면 없음)
  more?: boolean; // 첫 화면: '다음' 대신 '더 보기' 한 개
}

// 버튼 l·neutral 과 같은 모양 (Button 은 prefetch 를 끌 수 없어서 Link 를 직접 쓴다)
const BUTTON =
  "press inline-flex min-h-12 flex-1 items-center justify-center gap-1 rounded-btn bg-fill-weak px-4 text-t5 font-semibold text-ink-700";

// 피드 끝의 쪽 링크. 검색엔진·AI 크롤러는 스크롤을 하지 않아서 이 <a href> 로 다음 글을 찾아간다.
// 스크롤로 다음 쪽을 이어 붙여도 이 링크는 남는다 (FeedLoader 가 next 를 붙인 다음 쪽으로 옮긴다)
export function Pager({ category, prev, next, more }: Props) {
  const t = useTranslations("Feed");
  if (!prev && !next) return null;
  return (
    <nav aria-label={t("pagination")} className="flex gap-2 px-gutter pt-6">
      {prev && (
        <Link href={pagePath(prev, category)} prefetch={false} rel="prev" className={BUTTON}>
          <ChevronRightIcon className="size-4 rotate-180 text-ink-400" />
          {t("prev")}
        </Link>
      )}
      {next && (
        <Link href={pagePath(next, category)} prefetch={false} rel="next" className={BUTTON}>
          {more ? t("more") : t("next")}
          <ChevronRightIcon className="size-4 text-ink-400" />
        </Link>
      )}
    </nav>
  );
}
