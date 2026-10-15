import { PostDetail } from "@/app/api/posts/[id]/route";
import { MainListResponse } from "@/app/api/news/mainList/route";
import { NewsCardProps } from "@/components/common/NewsCard";
import { SlideItem } from "@/mocks/data/news";
import { NewsListResponse } from "@/app/api/news/list/route";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface ApiError {
  error: string;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface FetchConfig extends RequestInit {
  method?: HttpMethod;
  data?: any;
  cache?: RequestCache;
  headers?: HeadersInit;
  revalidate?: number;
}

// API 응답 타입 체크 유틸리티
function isApiError(data: any): data is ApiError {
  return "error" in data;
}

// GET 요청을 위한 설정 타입
interface FetchOptions {
  revalidate?: number;
  cache?: RequestCache;
  headers?: HeadersInit;
  next?: NextFetchRequestConfig;
}

// GET 요청을 위한 fetch 함수
async function fetchApi<T>(
  endpoint: string,
  {
    revalidate,
    cache = "no-store",
    headers = {},
    next,
    ...config
  }: FetchOptions = {}
): Promise<T> {
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: defaultHeaders,
    cache: cache,
    next: revalidate ? { revalidate, ...next } : next,
    ...config,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => {
      return { error: "Failed to fetch data jsonjsonjson" };
    });
    throw new Error(`fetchApi 함수에서 실행 
      endpoint: ${endpoint}
      API error: ${errorData}
      response.status: ${response.status}
      response.statusText: ${response.statusText}
      response: ${JSON.stringify(response)}`);
  }

  const data = await response.json();

  if (isApiError(data)) {
    throw new Error(data.error);
  }

  return data as T;
}

// POST, PUT, DELETE 요청을 위한 fetch 함수
async function mutateApi<T>(
  endpoint: string,
  { method, data, headers = {}, ...config }: FetchConfig
): Promise<T> {
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: defaultHeaders,
    body: data ? JSON.stringify(data) : undefined,
    cache: "no-store",
    ...config,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const responseData = await response.json();

  if (isApiError(responseData)) {
    throw new Error(responseData.error);
  }

  return responseData as T;
}

// GET 요청들
export async function getPostDetail(id: string): Promise<PostDetail> {
  console.log("id :>> ", id);
  return fetchApi<PostDetail>(`/api/posts/${id}`, {
    // revalidate: 30,
  });
}

export async function getSlides(): Promise<SlideItem[]> {
  return fetchApi<SlideItem[]>("/api/slides", {
    // revalidate: 300,
  });
}

// POST, PUT, DELETE 요청들
export async function likePost(postId: number): Promise<void> {
  return mutateApi(`/api/posts/${postId}/like`, {
    method: "POST",
  });
}

export async function updatePost(
  postId: number,
  data: Partial<PostDetail>
): Promise<PostDetail> {
  return mutateApi<PostDetail>(`/api/posts/${postId}`, {
    method: "PUT",
    data,
  });
}

export async function deletePost(postId: number): Promise<void> {
  return mutateApi(`/api/posts/${postId}`, {
    method: "DELETE",
  });
}

// 페이지네이션 API 함수 추가
export async function getMainList(page: number = 1): Promise<MainListResponse> {
  return fetchApi<MainListResponse>(`/api/news/mainList?page=${page}`, {
    // revalidate: 60,
  });
}

// 새로운 통합 뉴스 리스트 조회 함수
export async function getNewsList({
  category,
  page = 1,
  size = 12,
  sortBy = "createdAt",
  order = "desc",
}: {
  category?: string;
  page?: number;
  size?: number;
  sortBy?: "createdAt" | "views";
  order?: "asc" | "desc";
} = {}): Promise<NewsListResponse> {
  const params = new URLSearchParams({
    ...(category && { category }),
    page: page.toString(),
    size: size.toString(),
    sortBy,
    order,
  });

  return fetchApi<NewsListResponse>(`/api/news/list?${params.toString()}`, {
    // revalidate: 60,
  });
}

// // 기본 사용 (최신순 전체 뉴스)
// const news = await getNewsList();

// // K-POP 카테고리 뉴스 조회
// const kpopNews = await getNewsList({ category: "K-POP" });

// // 조회수 순으로 정렬
// const popularNews = await getNewsList({ sortBy: "views" });

// // 페이지네이션 적용
// const secondPage = await getNewsList({ page: 2, size: 20 });

// // 여러 옵션 조합
// const customNews = await getNewsList({
//   category: "MAIN",
//   sortBy: "views",
//   order: "desc",
//   page: 1,
//   size: 8,
// });
