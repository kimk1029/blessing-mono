"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { toast } from "sonner";
import { formatDistanceToNow } from "@/lib/utils";
import type { AffiliationPost } from "@/types";
import { ArrowLeft, Eye, Trash2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ChurchPostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { data: post } = useSWR<AffiliationPost>(
    session ? `/api/affiliations/posts/${id}` : null,
    fetcher
  );

  const handleDelete = async () => {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/affiliations/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("삭제되었습니다.");
      router.push("/church");
    } else {
      const d = await res.json();
      toast.error(d.message);
    }
  };

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
        로그인이 필요합니다.
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  const isAuthor = session.user?.id === String(post.author?.id);

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
          {isAuthor && (
            <button onClick={handleDelete} className="text-red-500 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
          <span>{post.author?.username}</span>
          <span>{post.affiliation}</span>
          <span>{formatDistanceToNow(post.created_at)}</span>
          <span className="flex items-center gap-1"><Eye size={14} />{post.views}</span>
        </div>

        {post.images?.length > 0 && (
          <div className="mb-6">
            {post.images.map((img, i) => (
              <img key={i} src={`/uploads/${img}`} alt="" className="w-full rounded-lg mb-2" />
            ))}
          </div>
        )}

        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
          {post.content}
        </div>
      </article>
    </div>
  );
}
