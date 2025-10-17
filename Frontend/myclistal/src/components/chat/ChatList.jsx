// src/components/chat/ChatList.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import NewChatModal from "./NewChatModal";
import { Plus, Search } from "lucide-react";
import { getChats } from "../../api/chat";
import { Transition } from "@headlessui/react";
import useSortedChats from "../../hooks/useSortedChats";

export default function ChatList({
  chats = [],
  setChats = () => {},
  activeChat,
  onSelect,
  query,
  setQuery,
}) {
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);
  const chatRefs = useRef({});
  const listRef = useRef(null);
  const [prevUnread, setPrevUnread] = useState(0);

  // ✅ Extracted sorting + filtering + unread counting
  const { sortedChats, totalUnread } = useSortedChats(chats, query);

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const oneDay = 24 * 60 * 60 * 1000;

    if (diffMs < oneDay && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffMs < 2 * oneDay && date.getDate() === now.getDate() - 1) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  };

  // 🔁 Infinite scroll
  const loadMoreChats = useCallback(async () => {
    if (!hasMore) return;
    try {
      const nextPage = page + 1;
      const res = await getChats(nextPage, 20);
      if (Array.isArray(res.data.data) && res.data.data.length > 0) {
        setChats((prev = []) => [...prev, ...res.data.data]);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more chats", err);
    }
  }, [page, hasMore, setChats]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && loadMoreChats(),
      { threshold: 1.0 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMoreChats]);

  // 🪄 Animate unread badge change
  useEffect(() => {
    if (totalUnread !== prevUnread) setPrevUnread(totalUnread);
  }, [totalUnread, prevUnread]);

  // 🎯 Auto-scroll to active chat
  useEffect(() => {
    if (!activeChat?._id) return;
    const container = listRef.current;
    const target = chatRefs.current[activeChat._id];
    if (!container || !target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeChat, sortedChats]);

  const handleSelectChat = (chat) => {
    // Instantly remove local badge
    setChats((prev) =>
      prev.map((c) =>
        c._id === chat._id ? { ...c, hasNewLocal: false, unreadCount: 0 } : c
      )
    );
    onSelect(chat);
  };

  return (
    <aside className="bg-white h-full rounded-2xl shadow-lg p-4 flex flex-col relative border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-blue-800">Chats</h3>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-800 text-white p-2 rounded-md shadow hover:bg-blue-900 transition cursor-pointer"
          title="Start new chat"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* 🧠 Total unread badge */}
      <Transition
        show={totalUnread >= 0}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
        className="mb-2"
      >
        <div className="text-sm text-white bg-blue-800 px-2 py-0.5 rounded-full w-max">
          {totalUnread} Unread
        </div>
      </Transition>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chats..."
          className="w-full border border-gray-200 pl-9 pr-9 py-2 rounded-md focus:ring-2 focus:ring-blue-800 focus:border-blue-800 outline-none text-sm shadow-sm"
        />
      </div>

      {/* Chat list */}
      <div
        ref={listRef}
        className="overflow-y-auto flex-1 pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200"
      >
        {sortedChats.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            {chats.length === 0 ? "Loading chats..." : "No chats found"}
          </div>
        ) : (
          sortedChats.map((chat) => {
            const other =
              (chat.participants || []).find((p) => p.email !== chat.meEmail) ||
              chat.participants?.[0];
            const lastText = chat.lastMessage?.text || "No messages yet";
            const lastTime = chat.lastMessage?.createdAt || chat.updatedAt;
            const active = activeChat?._id === chat._id;
            const unread = chat.hasNewLocal || (chat.unreadCount || 0) > 0;

            // ✅ Style changes: red border for unread, blue for active, neutral otherwise
            const borderStyle = unread
              ? "border-l-4 border-red-600 "
              : active
              ? "border-l-4 border-blue-800"
              : "";

            return (
              <button
                key={chat._id}
                ref={(el) => (chatRefs.current[chat._id] = el)}
                onClick={() => handleSelectChat(chat)}
                className={`w-full flex cursor-pointer items-start gap-3 p-3 rounded-xl transition-all duration-200 text-left hover:shadow-md ${
                  active ? "bg-gray-100" : "hover:bg-gray-50"
                } ${borderStyle}`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center font-bold text-white shadow-sm uppercase">
                  {other?.email?.[0] || "U"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm truncate text-gray-900">
                      {other?.email || "Chat"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTime(lastTime)}
                    </div>
                  </div>
                  <p
                    className={`text-xs truncate mt-1 ${
                      unread ? "text-gray-900 font-semibold" : "text-gray-600"
                    }`}
                  >
                    {lastText}
                  </p>
                </div>
              </button>
            );
          })
        )}
        <div ref={loaderRef} className="h-8" />
      </div>

      {/* New Chat Modal */}
      {showModal && (
        <NewChatModal
          onClose={() => setShowModal(false)}
          onOpenChat={(chat) => {
            setChats((prev = []) => [chat, ...prev]);
            handleSelectChat(chat);
            setShowModal(false);
          }}
        />
      )}
    </aside>
  );
}
