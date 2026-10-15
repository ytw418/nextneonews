"use client";

import useSWRInfinite from "swr/infinite";
import { MainListResponse } from "@/app/api/news/mainList/route";
import { getMainList } from "@/libs/utils/api";

import { NewsCard } from "@/components/common/NewsCard";
import { SlideItem } from "@/mocks/data/news";
import InfiniteScroll from "react-infinite-scroll-component";
import SliderSection from "@/components/common/SliderSection";
import CoupangAd1 from "@/components/CoupangAds/CoupangAd1";
import CoupangAd2 from "@/components/CoupangAds/CoupangAd2";

interface MainClientProps {
  initialData: MainListResponse;
  slides: SlideItem[];
}

const MainClient = ({ initialData, slides }: MainClientProps) => {
  const getKey = (
    pageIndex: number,
    previousPageData: MainListResponse | null
  ) => {
    if (previousPageData && pageIndex + 1 > previousPageData.totalPages)
      return null;
    return `/api/news/mainList?page=${pageIndex + 1}`;
  };

  const { data, setSize, size } = useSWRInfinite<MainListResponse>(
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
      {/* 슬라이더 섹션 */}
      <section className="mb-8">
        <SliderSection slides={slides} />
        <CoupangAd1 />
      </section>

      {/* 무한 스크롤 컨테이너 */}
      <InfiniteScroll
        dataLength={data.length * 4} // 각 페이지당 4개의 카테고리
        next={() => setSize((prev) => prev + 1)}
        // next={() => console.log("next")}
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
        {/* 각 페이지의 뉴스 데이터 렌더링 */}
        {data.map((pageData, pageIndex) => (
          <div key={pageIndex}>
            {/* 인기 뉴스 섹션 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">인기 뉴스</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {pageData.popularNews.map((news) => (
                  <NewsCard
                    key={`popular-${news.id}-${pageIndex}`}
                    {...news}
                    createdAt={news.createdAt.toString()}
                    updatedAt={news.updatedAt.toString()}
                    tags={news.tags}
                    views={news.views}
                  />
                ))}
              </div>
            </section>

            <a href="https://link.coupang.com/a/b3wHjd">
              이벤트/프로모션 로켓패션, 겨울 인기 패션 (~12/8)
            </a>

            {/* K-pop 뉴스 섹션 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">K-POP 뉴스</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {pageData.kpopNews.map((news) => (
                  <NewsCard
                    key={`kpop-${news.id}-${pageIndex}`}
                    {...news}
                    createdAt={news.createdAt.toString()}
                    updatedAt={news.updatedAt.toString()}
                    tags={news.tags}
                    views={news.views}
                  />
                ))}
              </div>
            </section>

            <CoupangAd2 />

            {/* 주요 뉴스 섹션 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">주요 뉴스</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {pageData.mainNews.map((news) => (
                  <NewsCard
                    key={`main-${news.id}-${pageIndex}`}
                    {...news}
                    createdAt={news.createdAt.toString()}
                    updatedAt={news.updatedAt.toString()}
                    tags={news.tags}
                    views={news.views}
                  />
                ))}
              </div>
            </section>

            {/* AI 뉴스 섹션 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">AI 뉴스</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {pageData.aiNews.map((news) => (
                  <NewsCard
                    key={`ai-${news.id}-${pageIndex}`}
                    {...news}
                    createdAt={news.createdAt.toString()}
                    updatedAt={news.updatedAt.toString()}
                    tags={news.tags}
                    views={news.views}
                  />
                ))}
              </div>
            </section>
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
};

export default MainClient;
