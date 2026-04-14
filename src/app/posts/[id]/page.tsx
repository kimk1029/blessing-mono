"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Link from "next/link";
import { toast } from "sonner";
import { TAG_LABELS, type Post, type Comment } from "@/types";
import { formatDistanceToNow } from "@/lib/utils";
import { Heart, Eye, MessageSquare, ArrowLeft, Trash2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const { data: post, mutate: mutatePost } = useSWR<Post & {
    commentCount: number;
    likeCount: number;
    liked: boolean;
    imageUrls: string[];
  }>(`/api/posts/${id}`, fetcher);

  const { data: comments, mutate: mutateComments } = useSWR<Comment[]>(
    `/api/posts/${id}/comments`,
    fetcher
  );

  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async () => {
    if (!session) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    const res = await fetch(`/api/posts/${id}/likes`, { method: "POST" });
    if (res.ok) mutatePost();
  };

  const handleDelete = async () => {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("게시글이 삭제되었습니다.");
      router.push("/");
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) { toast.error("로그인이 필요합니다."); return; }
    if (!commentText.trim()) return;

    setSubmitting(true);
    const res = await fetch(`/api/posts/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText, parentId: replyTo }),
    });
    setSubmitting(false);

    if (res.ok) {
      setCommentText("");
      setReplyTo(null);
      mutateComments();
      mutatePost();
    }
  };

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  const isAuthor = session?.user?.id === String(post.author?.id);

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
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
              {TAG_LABELS[post.tag || (post as any).category]}
            </span>
            <h1 className="text-2xl font-bold mt-2">{post.title}</h1>
          </div>
          {isAuthor && (
            <div className="flex gap-2 shrink-0">
              <Link
                href={`/posts/${id}/edit`}
                className="text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
              >
                수정
              </Link>
              <button
                onClick={handleDelete}
                className="text-sm text-red-500 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <span>{post.author?.username}</span>
          <span>{formatDistanceToNow(post.created_at)}</span>
          <span className="flex items-center gap-1"><Eye size={14} />{post.views}</span>
        </div>

        {/* 이미지 */}
        {post.imageUrls?.length > 0 && (
          <div className="mb-6">
            {post.imageUrls.map((url, i) => (
              <img key={i} src={url} alt="" className="w-full rounded-lg mb-2" />
            ))}
          </div>
        )}

        {/* 본문 */}
        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
          {post.content}
        </div>

        {/* 좋아요 */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
              post.liked
                ? "border-red-400 text-red-500 bg-red-50 dark:bg-red-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-red-400 hover:text-red-500"
            }`}
          >
            <Heart size={16} fill={post.liked ? "currentColor" : "none"} />
            <span>{post.likeCount}</span>
          </button>
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <MessageSquare size={14} />
            {post.commentCount}
          </span>
        </div>
      </article>

      {/* 댓글 */}
      <section className="mt-6">
        <h2 className="font-semibold text-lg mb-4">댓글 {post.commentCount}개</h2>

        {/* 댓글 입력 */}
        <form onSubmit={handleComment} className="mb-6">
          {replyTo && (
            <div className="text-xs text-blue-600 mb-2 flex items-center gap-2">
              <span>답글 작성 중</span>
              <button type="button" onClick={() => setReplyTo(null)} className="underline">
                취소
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={session ? "댓글을 입력하세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
              disabled={!session}
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={submitting || !session || !commentText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg self-end transition-colors"
            >
              등록
            </button>
          </div>
        </form>

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {(comments || []).map((comment) => (
            <div key={comment.id}>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{comment.author?.username}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{formatDistanceToNow(comment.created_at)}</span>
                    <button
                      onClick={() => setReplyTo(comment.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      답글
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
              </div>

              {/* 대댓글 */}
              {(comment.replies || []).map((reply) => (
                <div
                  key={reply.id}
                  className="ml-8 mt-2 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{reply.author?.username}</span>
                    <span className="text-xs text-gray-500">{formatDistanceToNow(reply.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{reply.content}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
