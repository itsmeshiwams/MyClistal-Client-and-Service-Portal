import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { useChatSync } from "../../hooks/useChatSync";
import ChatList from "../../components/chat/ChatList";
import ChatWindow from "../../components/chat/ChatWindow";
import ChatInput from "../../components/chat/ChatInput";
import { ArrowDown } from "lucide-react";

export default function ClientChat() {
  const { user } = useAuth();
  const socket = useSocket();

  const {
    chats,
    activeChat,
    messages,
    query,
    handleSearch,
    openChat,
    handleSend,
    setChats,
    currentUserId,
    bindScroll,
    scrollToBottom,
    showJumpButton,
    unreadCount,
  } = useChatSync(socket, user, "Client");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-4rem)] p-4 bg-gray-50 relative">
      <div className="h-full overflow-hidden">
        <ChatList
          chats={chats}
          activeChat={activeChat}
          onSelect={openChat}
          query={query}
          setQuery={handleSearch}
          role="Client"
        />
      </div>

      <div className="col-span-2 flex flex-col h-full bg-white rounded-xl shadow-md overflow-hidden relative">
        <div ref={bindScroll} className="flex-1 overflow-y-auto">
          <ChatWindow
            activeChat={activeChat}
            messages={messages}
            user={user}
            currentUserId={currentUserId}
            onMarkRead={(chatId) =>
              setChats((prev) =>
                prev.map((c) =>
                  c._id === chatId
                    ? { ...c, unreadCount: 0, hasNewLocal: false }
                    : c
                )
              )
            }
          />
        </div>

        {showJumpButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 right-6 bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-1 hover:bg-blue-700 transition"
          >
            <ArrowDown size={16} />
            {unreadCount > 0 && (
              <span className="text-xs bg-white text-blue-600 rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>
        )}

        {activeChat && (
          <ChatInput onSend={handleSend} placeholder="Message staff..." />
        )}
      </div>
    </div>
  );
}
