// src/components/chat/ChatWindow.jsx
import React, { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";

export default function ChatWindow({ activeChat, messages = [], user }) {
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  if (!activeChat) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">Select a chat to view messages</div>;
  }

  const other = (activeChat.participants || []).find((p) => p.email !== user.email) || activeChat.participants?.[0];

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
          {other?.email?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <div className="font-semibold">{other?.email || activeChat.title}</div>
          <div className="text-xs text-gray-400">{other?.role}</div>
        </div>
        <div className="ml-auto text-sm text-gray-400">{new Date(activeChat.updatedAt).toLocaleString()}</div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {messages.map((m) => (
          <ChatMessage key={m._id || m.createdAt} message={m} isOwn={m.sender?.email === user.email} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
