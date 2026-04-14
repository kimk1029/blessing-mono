"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Link from "next/link";
import { toast } from "sonner";
import { formatDistanceToNow } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { data, mutate } = useSWR(session ? "/api/account" : null, fetcher);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", affiliation: "" });
  const [saving, setSaving] = useState(false);

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">
          로그인이 필요합니다.{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    );
  }

  const user = data?.user;
  const level = user?.level;

  const handleEdit = () => {
    setForm({
      username: user?.username || "",
      password: "",
      affiliation: user?.affiliation || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (form.username !== user?.username) body.username = form.username;
      if (form.password) body.password = form.password;
      if (form.affiliation !== (user?.affiliation || "")) body.affiliation = form.affiliation;

      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("프로필이 수정되었습니다.");
        setEditing(false);
        mutate();
        update();
      } else {
        const d = await res.json();
        toast.error(d.message || "수정에 실패했습니다.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">프로필</h1>

      {/* 사용자 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        {!editing ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{user?.username}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleEdit}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                수정
              </button>
            </div>
            {user?.affiliation && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                소속: {user.affiliation}
              </p>
            )}
            <div className="flex items-center gap-4 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{user?.points}</p>
                <p className="text-xs text-gray-500">포인트</p>
              </div>
              {level && (
                <div className="text-center">
                  <p className="text-lg font-bold">Lv.{level.level}</p>
                  <p className="text-xs text-gray-500">{level.title}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">사용자 이름</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                새 비밀번호 <span className="text-gray-400 font-normal">(변경 시에만 입력)</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="새 비밀번호"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">소속</label>
              <input
                type="text"
                value={form.affiliation}
                onChange={(e) => setForm({ ...form, affiliation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="교회/단체 이름"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 내 게시글 */}
      <div className="mb-6">
        <h2 className="font-semibold text-lg mb-3">내 게시글 ({data?.posts?.length ?? 0})</h2>
        <div className="space-y-2">
          {(data?.posts || []).slice(0, 10).map((post: any) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-sm transition-shadow"
            >
              <p className="font-medium truncate">{post.title}</p>
              <p className="text-xs text-gray-500 mt-1">{formatDistanceToNow(post.created_at)}</p>
            </Link>
          ))}
          {(data?.posts || []).length === 0 && (
            <p className="text-sm text-gray-500">작성한 게시글이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
