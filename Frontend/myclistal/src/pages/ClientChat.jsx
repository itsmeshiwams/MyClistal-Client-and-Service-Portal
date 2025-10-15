// src/pages/ClientChat.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import { getChats, getMessages, sendMessage, markMessagesRead, getOrCreatePrivateChat, searchChats } from "../api/chat";

export default function ClientChat() {
  const { user } = useAuth();
  const socket = useSocket();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");

  // attach meId and meEmail to each chat for easier UI
  const normalizeChats = useCallback((list = []) => {
    return list.map((c) => ({
      ...c,
      meId: user?.id || user?._id || null,
      meEmail: user?.email,
    }));
  }, [user]);

  useEffect(() => { loadChats(); }, []);

  useEffect(() => {
    if (!socket) return;
    const onNew = (payload) => {
      // backend emits { chatId, message }
      const { chatId, message } = payload;
      // add message to active chat if matches
      if (activeChat && activeChat._id === chatId) {
        setMessages((m) => [...m, message]);
        // mark read
        markMessagesRead(chatId).catch(() => {});
      }
      // refresh chats to update lastMessage/unread
      loadChats();
    };

    socket.on("message:new", onNew);
    return () => {
      socket.off("message:new", onNew);
    };
  }, [socket, activeChat]);

  async function loadChats() {
    try {
      const res = await getChats();
      setChats(normalizeChats(res.data));
    } catch (err) {
      console.error("loadChats error", err);
    }
  }

  async function openChat(chat) {
    setActiveChat(chat);
    // join socket room
    if (socket && chat?._id) socket.emit("chat:join", chat._id);
    try {
      const res = await getMessages(chat._id);
      setMessages(res.data.messages || []);
      // mark read on open
      await markMessagesRead(chat._id);
      // refresh chat list (unread counts)
      loadChats();
    } catch (err) {
      console.error("openChat getMessages", err);
      setMessages([]);
    }
  }

  async function handleSend(text) {
    if (!activeChat) return;

    // determine recipientId for private chat
    const other = (activeChat.participants || []).find((p) => p.email !== user.email);
    const recipientId = other ? other._id : null;

    try {
      const res = await sendMessage(activeChat._id, text, recipientId);
      // backend returns message in res.data.message
      const serverMsg = res.data.message;
      setMessages((m) => [...m, serverMsg]);
      // refresh chats
      loadChats();
    } catch (err) {
      console.error("send error", err);
    }
  }

  async function handleSearch(q) {
    setQuery(q);
    if (!q || q.trim().length === 0) {
      loadChats();
      return;
    }
    try {
      const res = await searchChats(q);
      setChats(normalizeChats(res.data));
    } catch (err) {
      console.error("searchChats error", err);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-full gap-6 ">
      <ChatList chats={chats} activeChat={activeChat} onSelect={openChat} query={query} setQuery={handleSearch} role="Client" />
      <div className="col-span-2 flex flex-col">
        <ChatWindow activeChat={activeChat} messages={messages} user={user} />
        {activeChat && <ChatInput onSend={handleSend} placeholder="Message the staff..." />}
      </div>
    </div>
  );
}
