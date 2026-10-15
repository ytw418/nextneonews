"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/libs/utils/utils";

const categories = [
  { name: "인기순위", href: "/popular" },
  { name: "최신뉴스", href: "/latest-news" },
  { name: "K-POP", href: "/kpop" },
];

export const CategoryMenu = () => {
  const pathname = usePathname();

  return (
    <nav className="sticky top-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-20">
      <div className="container-custom">
        <div className="flex overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className={cn(
                "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative",
                "hover:text-primary",
                pathname === category.href
                  ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};
