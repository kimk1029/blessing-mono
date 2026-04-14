"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import PostCard from "@/components/PostCard";
import type { Post } from "@/types";
import { Search } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";
  const [q, setQ] = useState(initialQ);

  const { data: results, isLoading } = useSWR<Post[]>(
    initialQ ? `/api/search?q=${encodeURIComponent(initialQ)}` : null,
    fetcher
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">검색</h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="검색어를 입력하세요..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Search size={16} />
          검색
        </button>
      </form>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && initialQ && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            &quot;{initialQ}&quot; 검색 결과 {results?.length ?? 0}건
          </p>
          <div className="space-y-4">
            {(results || []).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {(results || []).length === 0 && (
              <p className="text-center text-gray-500 py-12">검색 결과가 없습니다.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-8 text-gray-500">로딩 중...</div>}>
      <SearchContent />
    </Suspense>
  );
}
