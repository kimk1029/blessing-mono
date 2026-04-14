"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { POST_TAGS, TAG_LABELS, type PostTag } from "@/types";

export default function WritePostPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "news" as PostTag,
  });
  const [image, setImage] = useState<File | null>(null);

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">
          로그인이 필요합니다.{" "}
          <a href="/login" className="text-blue-600 hover:underline">로그인</a>
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error("제목과 내용을 입력해주세요.");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("content", form.content);
    formData.append("category", form.category);
    if (image) formData.append("image", image);

    try {
      const res = await fetch("/api/posts", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "게시글 작성에 실패했습니다.");
      } else {
        toast.success("게시글이 작성되었습니다!");
        router.push(`/posts/${data.id}`);
      }
    } catch {
      toast.error("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">글쓰기</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">카테고리</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as PostTag })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {POST_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {TAG_LABELS[tag]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">제목</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="제목을 입력하세요"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">내용</label>
          <textarea
            required
            rows={12}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="내용을 입력하세요"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            이미지 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
