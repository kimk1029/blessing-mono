"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="font-bold text-xl text-blue-600 dark:text-blue-400">
          Blessing
        </Link>

        {/* 데스크톱 메뉴 */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
            홈
          </Link>
          <Link href="/anonymous" className="hover:text-blue-600 dark:hover:text-blue-400">
            익명 게시판
          </Link>
          <Link href="/church" className="hover:text-blue-600 dark:hover:text-blue-400">
            소속 게시판
          </Link>
          <Link href="/search" className="hover:text-blue-600 dark:hover:text-blue-400">
            검색
          </Link>
          <Link href="/chat" className="hover:text-blue-600 dark:hover:text-blue-400">
            채팅
          </Link>
        </div>

        {/* 사용자 메뉴 */}
        <div className="flex items-center gap-3 text-sm">
          {session ? (
            <>
              <Link
                href="/profile"
                className="hidden md:block hover:text-blue-600 dark:hover:text-blue-400"
              >
                {session.user?.name}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-1.5 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                로그인
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
