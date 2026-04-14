import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";
import { TAG_LABELS, type Post } from "@/types";
import { MessageSquare, Heart, Eye } from "lucide-react";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
              {TAG_LABELS[post.tag || post.category!]}
            </span>
          </div>
          <Link
            href={`/posts/${post.id}`}
            className="block font-semibold hover:text-blue-600 dark:hover:text-blue-400 truncate"
          >
            {post.title}
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {post.content}
          </p>
        </div>
        {post.images?.length > 0 && (
          <img
            src={`/uploads/${post.images[0]}`}
            alt=""
            className="w-16 h-16 object-cover rounded shrink-0"
          />
        )}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span>{post.author?.username}</span>
        <span>{formatDistanceToNow(post.created_at)}</span>
        <span className="flex items-center gap-1">
          <Eye size={12} />
          {post.views}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={12} />
          {post.comments}
        </span>
        <span className="flex items-center gap-1">
          <Heart size={12} />
          {post.likes}
        </span>
      </div>
    </div>
  );
}
