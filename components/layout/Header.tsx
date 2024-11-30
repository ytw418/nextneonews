"use client";

import React from "react";
import Link from "next/link";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="text-xl font-bold text-[#0064FF]">
            neonews
          </Link>
          <button className="space-y-1.5 p-2">
            <div className="w-6 h-0.5 bg-black"></div>
            <div className="w-6 h-0.5 bg-black"></div>
            <div className="w-6 h-0.5 bg-black"></div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
