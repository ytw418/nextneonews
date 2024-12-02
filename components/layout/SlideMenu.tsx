"use client";

import { PenSquare, Bot, Globe } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface SlideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SlideMenu = ({ isOpen, onClose }: SlideMenuProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute right-0 h-full w-[60vw] min-w-[260px] max-w-[420px] bg-background flex flex-col shadow-xl">
        <div className="flex w-full flex-col items-center justify-center gap-y-5">
          {/* 프로필 섹션 */}
          <div className="flex w-full flex-col items-start justify-center gap-y-2 px-5 pt-14">
            <div className="h-10 w-10 rounded-[7px] bg-gray-100" />
            <div className="flex cursor-pointer items-center justify-start gap-x-2 text-foreground">
              <p className="font-medium">로그인 하기</p>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="-rotate-90"
              >
                <path d="M20.05 8.62c0 .2 0 .4-.1.5-.1.2-.2.3-.3.4l-6.8 6.8c-.1.1-.3.2-.4.3-.2.1-.3.1-.5.1s-.4 0-.5-.1c-.2-.1-.3-.2-.4-.3l-6.7-6.8c-.1-.1-.2-.3-.3-.4-.1-.2-.1-.3-.1-.5s0-.4.1-.5c.1-.2.2-.3.3-.4.1-.1.3-.2.4-.3.2-.1.3-.1.5-.1s.4 0 .5.1c.2.1.3.2.4.3l5.8 5.8 5.8-5.8c.2-.2.4-.3.7-.4.3-.1.5 0 .8.1.2.1.5.3.6.5.1.2.2.5.2.7Z" />
              </svg>
            </div>
          </div>

          {/* 메뉴 아이템 */}
          <div className="flex w-full flex-col items-center justify-start">
            <Link
              href="/write"
              className="flex w-full items-center justify-start gap-x-3 px-5 py-3 hover:bg-gray-100 transition-colors"
              onClick={onClose}
            >
              <PenSquare className="w-5 h-5" />
              <p>뉴스 직접 쓰기</p>
            </Link>
            <Link
              href="/generate"
              className="flex w-full items-center justify-start gap-x-3 px-5 py-3 hover:bg-gray-100 transition-colors"
              onClick={onClose}
            >
              <Bot className="w-5 h-5" />
              <p>AI 뉴스 생성</p>
            </Link>

            {/* 구분선 */}
            <div className="w-full px-5 py-2">
              <div className="h-[1px] w-full bg-gray-200" />
            </div>

            {/* 언어 설정 */}
            <div className="flex w-full items-center justify-between px-5 py-3">
              <div className="flex items-center gap-x-3">
                <Globe className="w-5 h-5" />
                <p>언어설정</p>
              </div>
              <div className="text-sm text-gray-600">한국어</div>
            </div>
          </div>
        </div>

        {/* 하단 섹션 */}
        <div className="mt-auto w-full px-5 pb-7">
          <Link
            href="https://github.com/your-username/your-repo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-auto w-full items-center justify-center gap-x-2 rounded bg-primary py-5 text-white hover:opacity-90 transition-opacity"
          >
            <span className="font-medium">GitHub에서 보기</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
