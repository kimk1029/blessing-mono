"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";

interface Message {
  username: string;
  msg: string;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      path: "/api/socket",
      auth: { token: (session as any).accessToken || "" },
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("chat message", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });
    socket.on("update users", (userList: string[]) => setUsers(userList));

    return () => {
      socket.disconnect();
    };
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit("chat message", input.trim());
    setInput("");
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">
          실시간 채팅은 로그인 후 이용 가능합니다.{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">실시간 채팅</h1>
      <div className="grid grid-cols-4 gap-4 h-[600px]">
        {/* 채팅 영역 */}
        <div className="col-span-3 flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium">채팅</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {connected ? "연결됨" : "연결 중..."}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.username === session.user?.name ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.username === session.user?.name
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {msg.username !== session.user?.name && (
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                      {msg.username}
                    </p>
                  )}
                  <p>{msg.msg}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!connected || !input.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              전송
            </button>
          </form>
        </div>

        {/* 접속자 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400">
            접속자 ({users.length})
          </h3>
          <ul className="space-y-2">
            {users.map((user, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <span className="truncate">{user}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
