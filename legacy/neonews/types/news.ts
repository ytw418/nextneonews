export type Category =
  | "테크"
  | "모바일"
  | "자동차"
  | "금융"
  | "경제"
  | "K-POP"
  | "엔터테인먼트"
  | "게임"
  | "라이프스타일";

export interface NewsBase {
  id: number;
  title: string;
  summary: string;
  content?: string;
  imageUrl: string;
  category: Category;
  tags: string[];
  views: number;
  author?: string;
  source?: string;
  language: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface NewsResponse extends NewsBase {
  createdAt: string;
  updatedAt: string;
}

export interface NewsDB extends NewsBase {
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsCardProps {
  id: number;
  title: string;
  summary: string;
  content: string | null;
  imageUrl: string;
  category: string;
  tags: string[];
  views: number;
  author: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}
