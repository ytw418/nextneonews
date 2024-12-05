"use client";

import useSWRInfinite from "swr/infinite";
import { MainListResponse } from "@/app/api/news/mainList/route";
import { getMainList } from "@/libs/utils/api";
import { NewsCard } from "@/components/common/NewsCard";
import InfiniteScroll from "react-infinite-scroll-component";

interface PopularClientProps {
  initialData: MainListResponse;
}

const PopularClient = ({ initialData }: PopularClientProps) => {
  const getKey = (
    pageIndex: number,
    previousPageData: MainListResponse | null
  ) => {
    if (previousPageData && pageIndex + 1 > previousPageData.totalPages)
      return null;
    return `/api/news/mainList?page=${pageIndex + 1}`;
  };

  const { data, setSize } = useSWRInfinite<MainListResponse>(
    getKey,
    (url) => getMainList(Number(url.split("=")[1])),
    {
      fallbackData: [initialData],
      revalidateFirstPage: false,
    }
  );

  if (!data) return <div>로딩 중...</div>;

  const hasMore =
    data[data.length - 1]?.currentPage < data[data.length - 1]?.totalPages;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-8">인기 뉴스</h1>
      <InfiniteScroll
        dataLength={data.length}
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
          {data.map((pageData, pageIndex) =>
            pageData.popularNews.map((news) => (
              <NewsCard
                key={`popular-${news.id}-${pageIndex}`}
                {...news}
                createdAt={news.createdAt.toString()}
                tags={[]}
              />
            ))
          )}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default PopularClient;
