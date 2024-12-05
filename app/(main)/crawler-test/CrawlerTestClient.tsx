"use client";

import { useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface NewsItem {
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
  originalUrl: string;
}

interface CrawlResponse {
  success: boolean;
  count: number;
  data: NewsItem[];
  error?: string;
}

const CrawlerTestClient = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string>("");

  const handleCrawl = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/news/findData");
      const data: CrawlResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "크롤링에 실패했습니다.");
      }

      setResults(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">네이버 연예뉴스 크롤러</h1>

      <button
        onClick={handleCrawl}
        disabled={loading}
        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "크롤링 중..." : "크롤링 시작"}
      </button>

      {loading && <LoadingSpinner />}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 space-y-8">
          <h2 className="text-xl font-semibold">
            크롤링 결과 ({results.length}건)
          </h2>
          {results.map((item, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 space-y-2 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{item.summary}</p>
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full max-w-lg rounded-lg"
                />
              )}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>작성자: {item.author}</p>
                <p>작성일: {item.publishedAt}</p>
                <a
                  href={item.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  원문 보기
                </a>
              </div>
              <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <pre className="whitespace-pre-wrap">{item.content}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CrawlerTestClient;
