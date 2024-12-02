"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { SlideMenu } from "./SlideMenu";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-30">
        <div className="container-custom h-full flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold text-gray-900 dark:text-white hover:text-primary transition-colors"
          >
            <span className="text-primary">neo</span>
            news
          </Link>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </header>

      <SlideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};
