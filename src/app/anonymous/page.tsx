"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";
import type { AnonymousPost } from "@/types";
import { MessageSquare, Heart, Eye } from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AnonymousPage() {
  const { data: posts, mutate } = useSWR<AnonymousPost[]>("/api/anonymous/posts", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error("제목과 내용을 입력해주세요.");
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch("/api/anonymous/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("게시글이 작성되었습니다.");
        setForm({ title: "", content: "" });
        setShowForm(false);
        mutate();
      } else {
        const d = await res.json();
        toast.error(d.message || "작성에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">익명 게시판</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          {showForm ? "취소" : "글쓰기"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6 space-y-3">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="제목"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            rows={4}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="내용"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg transition-colors"
          >
            {submitting ? "등록 중..." : "등록"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {(posts || []).map((post) => (
          <Link
            key={post.id}
            href={`/anonymous/${post.id}`}
            className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold mb-1">{post.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{post.content}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatDistanceToNow(post.created_at)}</span>
              <span className="flex items-center gap-1"><Eye size={12} />{post.views}</span>
              <span className="flex items-center gap-1"><MessageSquare size={12} />{post.comments}</span>
              <span className="flex items-center gap-1"><Heart size={12} />{post.likes}</span>
            </div>
          </Link>
        ))}
        {(posts || []).length === 0 && (
          <p className="text-center text-gray-500 py-12">게시글이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
