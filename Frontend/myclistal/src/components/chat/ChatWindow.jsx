import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from "react";
import ChatMessage from "./ChatMessage";
import { Loader2 } from "lucide-react";
import { useSocket } from "../../contexts/SocketContext";
import { markMessagesRead, getMessages } from "../../api/chat";

function formatDateSeparator(date) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ChatWindow({
  activeChat,
  messages = [],
  user,
  currentUserId,
  loading = false,
  setChats = () => {},
  onMarkRead = () => {},
  setMessages = () => {},
}) {
  const socket = useSocket();
  const scrollRef = useRef();
  const bottomRef = useRef();
  const [typingUsers, setTypingUsers] = useState([]);
  const [hasMarkedRead, setHasMarkedRead] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);

  /** ✅ Scroll to bottom when new message arrives */
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 150;
      if (isNearBottom) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
    setHasMarkedRead(false);
  }, [messages]);

  /** ✅ Load older messages on scroll up */
  const handleScroll = useCallback(async () => {
    const el = scrollRef.current;
    if (!el || !activeChat?._id || isFetchingMore || !hasMore) return;
    if (el.scrollTop < 80) {
      setIsFetchingMore(true);
      try {
        pageRef.current += 1;
        const res = await getMessages(activeChat._id, pageRef.current);
        const older = res.data.messages || [];
        if (older.length === 0) setHasMore(false);
        else {
          setMessages((prev) => [...older, ...prev]);
          const scrollHeightBefore = el.scrollHeight;
          setTimeout(() => {
            el.scrollTop = el.scrollHeight - scrollHeightBefore + el.scrollTop;
          }, 50);
        }
      } catch (err) {
        console.error("Load older messages error:", err);
      } finally {
        setIsFetchingMore(false);
      }
    }
  }, [activeChat?._id, isFetchingMore, hasMore, setMessages]);

  /** ✅ Typing indicator */
  useEffect(() => {
    if (!socket || !activeChat?._id) return;

    const handleTyping = ({ chatId, userEmail, isTyping }) => {
      if (chatId !== activeChat._id) return;
      setTypingUsers((prev) =>
        isTyping
          ? [...new Set([...prev, userEmail])]
          : prev.filter((u) => u !== userEmail)
      );
    };

    socket.on("typing", handleTyping);
    return () => socket.off("typing", handleTyping);
  }, [socket, activeChat?._id]);

  /** ✅ Mark messages read on open */
  useEffect(() => {
    if (activeChat?._id) {
      markMessagesRead(activeChat._id)
        .then(() => onMarkRead(activeChat._id))
        .catch(() => {});
      setHasMarkedRead(true);
      pageRef.current = 1;
      setHasMore(true);
    }
  }, [activeChat?._id, onMarkRead]);

  /** ✅ Attach scroll listener */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  /** ✅ Group messages by date (sorted oldest → newest) */
  const groupedMessages = useMemo(() => {
    const groups = {};
    [...messages]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .forEach((msg) => {
        const dateKey = new Date(msg.createdAt).toDateString();
        groups[dateKey] = groups[dateKey] || [];
        groups[dateKey].push(msg);
      });
    return groups;
  }, [messages]);

  const other =
    activeChat?.participants?.find((p) => p.email !== user.email) || {};

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl shadow-inner">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 p-4 bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-md">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
          {other?.email?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-base">
            {other?.email || activeChat.title}
          </div>
          {typingUsers.length > 0 ? (
            <div className="text-xs text-blue-200 animate-pulse">
              {typingUsers.join(", ")} typing...
            </div>
          ) : (
            <div className="text-xs text-blue-100">{other?.role}</div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col-reverse gap-3 scrollbar-thin scrollbar-thumb-gray-300"
      >
        <div ref={bottomRef} />

        {/* Bottom sentinel (newest message) */}
        {Object.entries(groupedMessages)
          .reverse()
          .map(([dateKey, msgs]) => (
            <div key={dateKey} className="flex flex-col-reverse">
              {msgs
                .slice()
                .reverse()
                .map((m) => (
                  <ChatMessage
                    key={m._id || m.createdAt}
                    message={m}
                    isOwn={
                      m.sender?._id === currentUserId ||
                      m.sender?.email === user.email
                    }
                    otherParticipantId={other._id}
                  />
                ))}
              <div className="flex justify-center mt-3 mb-1">
                <span className="text-gray-700 text-sm px-3 py-1 bg-gray-100 rounded-full shadow-sm">
                  {formatDateSeparator(msgs[0].createdAt)}
                </span>
              </div>
            </div>
          ))}

        {loading && (
          <div className="flex justify-center py-4 text-blue-800">
            <Loader2 className="animate-spin mr-2" /> Loading messages...
          </div>
        )}
        {isFetchingMore && (
          <div className="flex justify-center text-gray-500 text-xs mb-2">
            <Loader2 className="animate-spin mr-1" size={14} />
            Loading older messages...
          </div>
        )}
      </div>
    </div>
  );
}
