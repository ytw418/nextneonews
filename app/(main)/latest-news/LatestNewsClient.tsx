"use client";

import useSWRInfinite from "swr/infinite";
import { NewsListResponse } from "@/app/api/news/list/route";
import { getNewsList } from "@/libs/utils/api";
import { NewsCard } from "@/components/common/NewsCard";
import InfiniteScroll from "react-infinite-scroll-component";

interface LatestNewsClientProps {
  initialData: NewsListResponse;
}

const LatestNewsClient = ({ initialData }: LatestNewsClientProps) => {
  const getKey = (pageIndex: number) => {
    return {
      page: pageIndex + 1,
      sortBy: "createdAt" as const,
      order: "desc" as const,
    };
  };

  const { data, setSize } = useSWRInfinite<NewsListResponse>(
    getKey,
    (key) => getNewsList(key),
    {
      fallbackData: [initialData],
      revalidateFirstPage: false,
    }
  );

  if (!data) return <div>로딩 중...</div>;

  const hasMore =
    data[data.length - 1]?.page < data[data.length - 1]?.totalPages;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-8">최신 뉴스</h1>
      <InfiniteScroll
        dataLength={data.reduce((acc, page) => acc + page.items.length, 0)}
        next={() => setSize((prev) => prev + 1)}
        hasMore={hasMore}
        loader={
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        }
        endMessage={
          <p className="text-center text-gray-500 py-8">
            모든 뉴스를 불러왔습니다.
          </p>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {data.map((pageData) =>
            pageData.items.map((news) => (
              <NewsCard
                key={`latest-${news.id}`}
                {...{
                  ...news,
                  content: news.content || undefined,
                  author: news.author || undefined,
                  source: news.source || undefined,
                }}
                createdAt={news.createdAt}
                tags={news.tags}
              />
            ))
          )}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default LatestNewsClient;