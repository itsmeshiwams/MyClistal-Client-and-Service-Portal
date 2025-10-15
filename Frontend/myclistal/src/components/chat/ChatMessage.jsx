// src/components/chat/ChatMessage.jsx
import React from "react";

export default function ChatMessage({ message, isOwn }) {
  return (
    <div className={`mb-3 flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[72%] px-4 py-2 rounded-lg shadow-sm ${isOwn ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-900"}`}>
        <div className="text-xs text-gray-200 mb-1">{message.sender?.email}</div>
        <div className="whitespace-pre-wrap">{message.text}</div>
        <div className="text-[10px] text-gray-300 mt-1 text-right">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
