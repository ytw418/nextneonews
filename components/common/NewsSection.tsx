"use client";

import React from "react";
import { NewsCard, NewsCardProps } from "@/components/common/NewsCard";

interface NewsSectionProps {
  title: string;
  items: NewsCardProps[];
}

export const NewsSection = ({ title, items }: NewsSectionProps) => {
  return (
    <div className="container-custom">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {items.map((item) => (
          <NewsCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
};
