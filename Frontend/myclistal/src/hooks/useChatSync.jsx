// src/hooks/useChatSync.js
import { useState, useEffect, useRef, useCallback } from "react";
import {
  getChats,
  getMessages,
  sendMessage,
  markMessagesRead,
  searchChats,
} from "../api/chat";

export const useChatSync = (socket, user, role) => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const readTimeout = useRef(null);
  const scrollRef = useRef(null);
  const isNearBottom = useRef(true);

  /** ✅ Normalize chats */
  const normalizeChats = useCallback(
    (list = []) => {
      if (!currentUserId && user) {
        for (const c of list) {
          const meP = (c.participants || []).find(
            (p) => p.email === user?.email
          );
          if (meP) {
            setCurrentUserId(meP._id);
            break;
          }
        }
      }
      return list.map((c) => {
        const me = (c.participants || []).find((p) => p.email === user?.email);
        const meId = me ? me._id : null;
        const unreadCount = c.unreadCounts ? c.unreadCounts[meId] || 0 : 0;
        return {
          ...c,
          meId,
          meEmail: user?.email,
          unreadCount,
          hasNewLocal: unreadCount > 0,
        };
      });
    },
    [user, currentUserId]
  );

  /** ✅ Fetch chats */
  const loadChats = useCallback(async () => {
    try {
      const res = await getChats(1, 20);
      setChats(normalizeChats(res.data.data));
    } catch (err) {
      console.error("loadChats error", err);
    }
  }, [normalizeChats]);

  /** ✅ Safe mark read */
  const safeMarkRead = useCallback(
    (chatId) => {
      clearTimeout(readTimeout.current);
      readTimeout.current = setTimeout(() => {
        markMessagesRead(chatId).catch(() => {});
        socket?.emit("chat:read", { chatId });
      }, 400);
    },
    [socket]
  );

  /** ✅ Search chats */
  const handleSearch = useCallback(
    async (q) => {
      setQuery(q);
      if (!q.trim()) return loadChats();
      try {
        const res = await searchChats(q);
        setChats(normalizeChats(res.data));
      } catch (err) {
        console.error("searchChats error", err);
      }
    },
    [normalizeChats, loadChats]
  );

  /** ✅ Open chat + messages */
  const openChat = useCallback(
    async (chat) => {
      if (!chat) return;
      setActiveChat(chat);

      if (socket && chat?._id) socket.emit("chat:join", chat._id);

      try {
        const res = await getMessages(chat._id);
        setMessages(res.data.messages || []);
        if (chat.unreadCount > 0) safeMarkRead(chat._id);
        // locally clear badge
        setChats((prev) =>
          prev.map((c) =>
            c._id === chat._id ? { ...c, hasNewLocal: false, unreadCount: 0 } : c
          )
        );
      } catch (err) {
        console.error("openChat error", err);
        setMessages([]);
      }
    },
    [socket, safeMarkRead]
  );

  /** ✅ Send message */
  const handleSend = useCallback(
    async (text) => {
      if (!activeChat) return;
      const other = (activeChat.participants || []).find(
        (p) => p.email !== user.email
      );
      const recipientId = other ? other._id : null;
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        sender: { email: user.email, _id: currentUserId },
        text,
        createdAt: new Date().toISOString(),
        statusMap: { [recipientId]: "delivered" },
      };
      setMessages((prev) => [...prev, tempMessage]);

      try {
        const res = await sendMessage(activeChat._id, text, recipientId);
        const serverMsg = res.data.message;
        setMessages((prev) =>
          prev.map((m) => (m._id === tempMessage._id ? serverMsg : m))
        );
        setChats((prev) => {
          const updated = prev.map((c) =>
            c._id === activeChat._id
              ? { ...c, lastMessage: serverMsg, updatedAt: serverMsg.createdAt }
              : c
          );
          return [...updated].sort(
            (a, b) =>
              new Date(b.lastMessage?.createdAt || b.updatedAt) -
              new Date(a.lastMessage?.createdAt || a.updatedAt)
          );
        });
      } catch (err) {
        console.error("sendMessage error", err);
      }
    },
    [activeChat, currentUserId, user]
  );

  /** ✅ Socket listeners */
  useEffect(() => {
    if (!socket) return;
    const onNewMessage = ({ chatId, message }) => {
      setChats((prev) => {
        const updated = prev.map((c) => {
          if (c._id === chatId) {
            const isActive = activeChat && activeChat._id === chatId;
            const unreadInc = isActive ? 0 : 1;
            return {
              ...c,
              lastMessage: message,
              updatedAt: message.createdAt,
              unreadCount: (c.unreadCount || 0) + unreadInc,
              hasNewLocal: unreadInc > 0,
            };
          }
          return c;
        });
        return [...updated].sort(
          (a, b) =>
            new Date(b.lastMessage?.createdAt || b.updatedAt) -
            new Date(a.lastMessage?.createdAt || a.updatedAt)
        );
      });

      if (activeChat && activeChat._id === chatId) {
        setMessages((m) => [...m, message]);
        safeMarkRead(chatId);
        if (isNearBottom.current) scrollToBottom();
        else {
          setUnreadCount((u) => u + 1);
          setShowJumpButton(true);
        }
      }
    };

    const onChatRead = ({ chatId, userId }) => {
      setChats((prev) =>
        prev.map((c) =>
          c._id === chatId ? { ...c, unreadCount: 0, hasNewLocal: false } : c
        )
      );
    };

    socket.on("message:new", onNewMessage);
    socket.on("chat:read", onChatRead);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("chat:read", onChatRead);
    };
  }, [socket, activeChat, safeMarkRead]);

  /** ✅ Scroll logic helpers */
  const handleScroll = useCallback((e) => {
    const el = e.target;
    const bottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <= 60;
    isNearBottom.current = bottom;
    if (bottom) {
      setUnreadCount(0);
      setShowJumpButton(false);
    }
  }, []);

  const bindScroll = useCallback(
    (node) => {
      if (scrollRef.current) {
        scrollRef.current.removeEventListener("scroll", handleScroll);
      }
      if (node) {
        node.addEventListener("scroll", handleScroll);
        scrollRef.current = node;
      }
    },
    [handleScroll]
  );

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setShowJumpButton(false);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, []);

  return {
    chats,
    activeChat,
    messages,
    query,
    handleSearch,
    openChat,
    handleSend,
    safeMarkRead,
    setChats,
    setMessages,
    currentUserId,
    bindScroll,
    scrollToBottom,
    showJumpButton,
    unreadCount,
  };
};
