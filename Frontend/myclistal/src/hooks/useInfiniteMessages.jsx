import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";

export const useInfiniteMessages = (chatId, token, socket) => {
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const scrollRef = useRef(null);
  const prevScrollHeight = useRef(0);
  const isNearBottom = useRef(true);

  // -----------------------------
  // ✅ Fetch messages (paginated)
  // -----------------------------
  const fetchMessages = useCallback(
    async (opts = { append: false }) => {
      if (!chatId || loading || (!hasMore && opts.append)) return;
      setLoading(true);
      try {
        const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const params = new URLSearchParams();
        params.append("limit", 20);
        if (cursor && opts.append) params.append("before", cursor);

        const { data } = await axios.get(
          `${backend}/chat/${chatId}/getmessages?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setMessages((prev) => {
          const combined = opts.append
            ? [...data.messages, ...prev]
            : data.messages;
          const map = new Map();
          combined.forEach((m) => map.set(m._id, m));
          return Array.from(map.values());
        });

        setHasMore(data.hasMore);
        setCursor(data.nextCursor);
      } catch (err) {
        console.error("❌ fetchMessages error:", err);
      } finally {
        setLoading(false);
      }
    },
    [chatId, token, cursor, hasMore, loading]
  );

  // -----------------------------
  // ✅ Initial load
  // -----------------------------
  useEffect(() => {
    if (!chatId) return;
    setMessages([]);
    setCursor(null);
    setHasMore(true);
    fetchMessages({ append: false });
  }, [chatId, fetchMessages]);

  // -----------------------------
  // ✅ Socket new messages
  // -----------------------------
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleNew = ({ chatId: cid, message }) => {
      if (cid !== chatId) return;

      setMessages((prev) => {
        const exists = prev.find((m) => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });

      if (!isNearBottom.current) {
        setUnreadCount((u) => u + 1);
        setShowJumpButton(true);
      } else {
        scrollToBottom();
      }
    };

    socket.on("message:new", handleNew);
    return () => socket.off("message:new", handleNew);
  }, [socket, chatId]);

  // -----------------------------
  // ✅ Scroll handling
  // -----------------------------
  const handleScroll = useCallback(
    async (e) => {
      const el = e.target;
      const top = el.scrollTop;
      const bottom =
        el.scrollHeight - el.scrollTop - el.clientHeight <= 50;

      isNearBottom.current = bottom;

      // hide jump button if user goes back down
      if (bottom) {
        setUnreadCount(0);
        setShowJumpButton(false);
      }

      // load older messages
      if (top <= 50 && hasMore && !loading) {
        prevScrollHeight.current = el.scrollHeight;
        await fetchMessages({ append: true });
        // restore scroll position
        const newScroll = el.scrollHeight - prevScrollHeight.current;
        el.scrollTop = newScroll;
      }
    },
    [fetchMessages, hasMore, loading]
  );

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

  // -----------------------------
  // ✅ Auto-scroll helpers
  // -----------------------------
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setShowJumpButton(false);
      setUnreadCount(0);
    }
  }, []);

  // -----------------------------
  // Return API
  // -----------------------------
  return {
    messages,
    loading,
    hasMore,
    bindScroll,
    showJumpButton,
    unreadCount,
    scrollToBottom,
  };
};
