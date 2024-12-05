"use client";

import React from "react";
import Link from "next/link";
import { NewsImage } from "@/components/atoms/NewsImage";
import { createSlugUrl } from "@/libs/utils/utils";

export interface NewsCardProps {
  id: number;
  title: string;
  summary: string;
  content?: string | null;
  imageUrl: string;
  category: string;
  tags: string[];
  views: number;
  author?: string | null;
  source?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const NewsCard = ({
  id,
  title,
  summary,
  createdAt,
  imageUrl,
  category,
  tags,
}: NewsCardProps) => {
  return (
    <Link href={`/post/${createSlugUrl(id, title)}`} className="block group">
      <div className="news-card h-full flex flex-col">
        <div className="mb-2 sm:mb-4">
          <NewsImage
            src={imageUrl}
            alt={title}
            className="group-hover:opacity-90 transition-opacity"
          />
        </div>
        <div className="flex-1 flex flex-col">
          {/* <span className="text-primary text-xs mb-2">{category}</span> */}
          <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 line-clamp-2 flex-grow">
            {title}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-2">
            {summary}
          </p>
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] sm:text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] sm:text-xs text-gray-400">
                +{tags.length - 3}
              </span>
            )}
          </div>
          <time className="text-[10px] sm:text-xs text-gray-400">
            {new Date(createdAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
      </div>
    </Link>
  );
};
