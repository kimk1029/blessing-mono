"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { formatDistanceToNow } from "@/lib/utils";
import type { AnonymousPost, AnonymousComment } from "@/types";
import { Heart, ArrowLeft, Eye } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AnonymousPostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: post, mutate: mutatePost } = useSWR<AnonymousPost & { isAuthor: boolean }>(
    `/api/anonymous/posts/${id}`,
    fetcher
  );
  const { data: comments, mutate: mutateComments } = useSWR<AnonymousComment[]>(
    `/api/anonymous/posts/${id}/comments`,
    fetcher
  );
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async () => {
    const res = await fetch(`/api/anonymous/posts/${id}/likes`, { method: "POST" });
    if (res.ok) mutatePost();
  };

  const handleDelete = async () => {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/anonymous/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("삭제되었습니다.");
      router.push("/anonymous");
    } else {
      const d = await res.json();
      toast.error(d.message);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);

    const res = await fetch(`/api/anonymous/posts/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText, parentId: replyTo }),
    });
    setSubmitting(false);

    if (res.ok) {
      setCommentText("");
      setReplyTo(null);
      mutateComments();
    }
  };

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
      >
        <ArrowLeft size={16} />
        뒤로가기
      </button>

      <article className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold">{post.title}</h1>
          {post.isAuthor && (
            <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-600">
              삭제
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
          <span>익명</span>
          <span>{formatDistanceToNow(post.created_at)}</span>
          <span className="flex items-center gap-1"><Eye size={14} />{post.views}</span>
        </div>

        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
          {post.content}
        </div>

        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 hover:border-red-400 hover:text-red-500 transition-colors"
          >
            <Heart size={16} />
            <span>{post.likes}</span>
          </button>
        </div>
      </article>

      {/* 댓글 */}
      <section className="mt-6">
        <h2 className="font-semibold text-lg mb-4">댓글 {post.comments}개</h2>

        <form onSubmit={handleComment} className="mb-6">
          {replyTo && (
            <div className="text-xs text-blue-600 mb-2 flex items-center gap-2">
              <span>답글 작성 중</span>
              <button type="button" onClick={() => setReplyTo(null)} className="underline">취소</button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요..."
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg self-end transition-colors"
            >
              등록
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {(comments || []).map((comment) => (
            <div key={comment.id}>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-500">익명</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatDistanceToNow(comment.createdAt)}</span>
                    <button onClick={() => setReplyTo(comment.id)} className="text-xs text-blue-600 hover:underline">
                      답글
                    </button>
                  </div>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
              {(comment.replies || []).map((reply) => (
                <div key={reply.id} className="ml-8 mt-2 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-500">익명</span>
                    <span className="text-xs text-gray-400">{formatDistanceToNow(reply.createdAt)}</span>
                  </div>
                  <p className="text-sm">{reply.content}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
