"use client";

import useSWRInfinite from "swr/infinite";
import { NewsListResponse } from "@/app/api/news/list/route";
import { getNewsList } from "@/libs/utils/api";
import { NewsCard } from "@/components/common/NewsCard";
import InfiniteScroll from "react-infinite-scroll-component";

interface KpopClientProps {
  initialData?: NewsListResponse;
}

const KpopClient = ({ initialData }: KpopClientProps = {}) => {
  const getKey = (pageIndex: number) => {
    return {
      page: pageIndex + 1,
      category: "K-POP",
    };
  };

  const { data, setSize, isLoading } = useSWRInfinite<NewsListResponse>(
    getKey,
    (key) => getNewsList(key),
    {
      // SSR로 받은 initialData가 있을 경우에만 fallbackData 설정
      ...(initialData && { fallbackData: [initialData] }),
      // SSR로 받은 첫 페이지 데이터를 재검증하지 않음
      revalidateFirstPage: false,
      // 브라우저 탭이 포커스될 때 데이터 재검증
      revalidateOnFocus: true,
      // 네트워크 재연결시 데이터 재검증
      revalidateOnReconnect: true,
      // 자동 갱신 간격 (ms), 0은 비활성화
      refreshInterval: 0,
      // 중복 요청 방지를 위한 시간 간격 (ms)
      dedupingInterval: 2000,
      // 에러 발생시 자동 재시도 여부
      shouldRetryOnError: true,
      // 최대 재시도 횟수
      errorRetryCount: 3,
      // 재시도 간격 (ms)
      errorRetryInterval: 5000,
      // React Suspense 모드 사용 여부
      suspense: false,
      // 새로운 데이터를 로딩하는 동안 이전 데이터 유지 여부
      keepPreviousData: false,
    }
  );

  if (isLoading || !data) return <div>로딩 중...</div>;

  const hasMore =
    data[data.length - 1]?.page < data[data.length - 1]?.totalPages;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-8">K-POP 뉴스</h1>
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
                key={`kpop-${news.id}`}
                {...news}
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

export default KpopClient;
