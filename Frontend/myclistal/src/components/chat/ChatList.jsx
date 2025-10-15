// src/components/chat/ChatList.jsx
import React from "react";

/**
 * props:
 * - chats: array
 * - activeChat
 * - onSelect(chat)
 * - query, setQuery
 */
export default function ChatList({ chats = [], activeChat, onSelect, query, setQuery, role }) {
  return (
    <aside className="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Conversations</h3>
        <span className="text-sm text-gray-500">{role}</span>
      </div>

      <div className="mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chats or participants..."
          className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div className="overflow-auto flex-1 space-y-2">
        {chats.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">No conversations yet</div>
        ) : (
          chats.map((chat) => {
            const other = (chat.participants || []).find((p) => p.email !== (chat.meEmail || "")) || chat.participants?.[0];
            const lastText = chat.lastMessage?.text || "No messages yet";
            return (
              <button
                key={chat._id}
                onClick={() => onSelect(chat)}
                className={`w-full text-left p-3 rounded-md flex items-start gap-3 hover:bg-gray-50 transition ${
                  activeChat?._id === chat._id ? "bg-gray-100" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-300 flex items-center justify-center text-indigo-700 font-semibold">
                  {other?.email?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm">{other?.email || chat.title || "Chat"}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1">{lastText}</p>
                </div>

                {chat.unreadCounts && (chat.unreadCounts[chat.meId] || chat.unreadCounts[chat.meId] === 0) ? (
                  chat.unreadCounts[chat.meId] > 0 && (
                    <div className="ml-2 bg-blue-700 text-white text-xs px-2 py-0.5 rounded-full">
                      {chat.unreadCounts[chat.meId]}
                    </div>
                  )
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
