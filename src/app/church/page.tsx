"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";
import type { AffiliationPost } from "@/types";
import { Eye } from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ChurchPage() {
  const { data: session } = useSession();
  const { data, mutate, error } = useSWR<AffiliationPost[]>(
    session ? "/api/affiliations/posts" : null,
    fetcher
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">
          소속 게시판은 로그인 후 이용 가능합니다.{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    );
  }

  if (error?.message?.includes("소속 정보")) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">소속 정보가 없습니다.</p>
        <Link href="/profile" className="text-blue-600 hover:underline">
          프로필에서 소속 설정하기
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) { toast.error("제목과 내용을 입력해주세요."); return; }
    setSubmitting(true);

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("content", form.content);
    if (image) fd.append("image", image);

    try {
      const res = await fetch("/api/affiliations/posts", { method: "POST", body: fd });
      if (res.ok) {
        toast.success("게시글이 작성되었습니다.");
        setForm({ title: "", content: "" });
        setImage(null);
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
        <div>
          <h1 className="text-2xl font-bold">소속 게시판</h1>
          {(session.user as any)?.affiliation && (
            <p className="text-sm text-gray-500 mt-1">
              {(session.user as any).affiliation}
            </p>
          )}
        </div>
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
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
        {(data || []).map((post) => (
          <Link
            key={post.id}
            href={`/church/${post.id}`}
            className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold mb-1">{post.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{post.content}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{post.author?.username}</span>
              <span>{formatDistanceToNow(post.created_at)}</span>
              <span className="flex items-center gap-1"><Eye size={12} />{post.views}</span>
            </div>
          </Link>
        ))}
        {(data || []).length === 0 && !error && (
          <p className="text-center text-gray-500 py-12">게시글이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
