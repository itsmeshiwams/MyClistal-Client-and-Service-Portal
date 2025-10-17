// src/hooks/useSortedChats.js
import { useMemo } from "react";

export default function useSortedChats(chats, query) {
  // Sort chats by last message time
  const sortedChats = useMemo(() => {
    const sorted = [...chats].sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt || b.updatedAt) -
        new Date(a.lastMessage?.createdAt || a.updatedAt)
    );

    if (!query.trim()) return sorted;

    return sorted.filter((chat) => {
      const other =
        (chat.participants || []).find((p) => p.email !== chat.meEmail) ||
        chat.participants?.[0];
      const email = other?.email?.toLowerCase() || "";
      return email.includes(query.toLowerCase());
    });
  }, [chats, query]);

  // Calculate total unread
  const totalUnread = useMemo(() => {
    return chats.reduce((acc, c) => acc + (c.hasNewLocal ? 1 : 0), 0);
  }, [chats]);

  return { sortedChats, totalUnread };
}
