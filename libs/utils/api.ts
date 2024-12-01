import { PostDetail } from "@/app/api/posts/[id]/route";
import { NewsCardProps } from "@/components/common/NewsCard";
import { SlideItem } from "@/mocks/data/news";

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
    throw new Error(`API error: ${response.statusText}`);
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
  return fetchApi<PostDetail>(`/api/posts/${id}`, {
    // revalidate: 30,
  });
}

export async function getMainNews(): Promise<NewsCardProps[]> {
  return fetchApi<NewsCardProps[]>("/api/news/main", {
    // revalidate: 60,
  });
}

export async function getKpopNews(): Promise<NewsCardProps[]> {
  return fetchApi<NewsCardProps[]>("/api/news/kpop", {
    // revalidate: 60,
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
