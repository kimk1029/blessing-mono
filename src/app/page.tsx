"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { POST_TAGS, TAG_LABELS, type Post, type PostTag } from "@/types";
import PostCard from "@/components/PostCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CATEGORIES: Array<{ value: PostTag | "all"; label: string }> = [
  { value: "all", label: "전체" },
  ...POST_TAGS.map((t) => ({ value: t, label: TAG_LABELS[t] })),
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<PostTag | "all">("all");

  const apiUrl =
    activeCategory === "all"
      ? "/api/posts?limit=20"
      : `/api/posts?category=${activeCategory}&limit=20`;

  const { data, isLoading } = useSWR<{ posts: Post[] }>(apiUrl, fetcher);

  // 인기 게시글 (조회수 기준 상위 5개)
  const { data: popularData } = useSWR<{ posts: Post[] }>("/api/posts?limit=100", fetcher);
  const popularPosts = [...(popularData?.posts || [])]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 메인 영역 */}
        <div className="lg:col-span-3">
          {/* 카테고리 탭 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.value
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 게시글 목록 */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(data?.posts || []).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {(data?.posts || []).length === 0 && (
                <p className="text-center text-gray-500 py-12">게시글이 없습니다.</p>
              )}
            </div>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 글쓰기 버튼 */}
          <Link
            href="/posts/write"
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            글쓰기
          </Link>

          {/* 인기 게시글 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
              인기 게시글
            </h3>
            <ul className="space-y-2">
              {popularPosts.map((post, idx) => (
                <li key={post.id} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-blue-500 mt-0.5 w-4 shrink-0">
                    {idx + 1}
                  </span>
                  <Link
                    href={`/posts/${post.id}`}
                    className="text-sm hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 빠른 링크 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
              바로가기
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/anonymous" className="hover:text-blue-600 dark:hover:text-blue-400">
                  익명 게시판
                </Link>
              </li>
              <li>
                <Link href="/church" className="hover:text-blue-600 dark:hover:text-blue-400">
                  소속 게시판
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-blue-600 dark:hover:text-blue-400">
                  실시간 채팅
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
