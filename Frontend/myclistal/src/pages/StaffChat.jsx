// src/pages/StaffChat.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import { getChats, getMessages, sendMessage, markMessagesRead, getOrCreatePrivateChat, searchChats } from "../api/chat";

export default function StaffChat() {
  const { user } = useAuth();
  const socket = useSocket();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");

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
      const { chatId, message } = payload;
      if (activeChat && activeChat._id === chatId) {
        setMessages((m) => [...m, message]);
        markMessagesRead(chatId).catch(() => {});
      }
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
    if (socket && chat?._id) socket.emit("chat:join", chat._id);
    try {
      const res = await getMessages(chat._id);
      setMessages(res.data.messages || []);
      await markMessagesRead(chat._id);
      loadChats();
    } catch (err) {
      console.error("openChat getMessages", err);
      setMessages([]);
    }
  }

  async function handleSend(text) {
    if (!activeChat) return;

    const other = (activeChat.participants || []).find((p) => p.email !== user.email);
    const recipientId = other ? other._id : null;

    try {
      const res = await sendMessage(activeChat._id, text, recipientId);
      const serverMsg = res.data.message;
      setMessages((m) => [...m, serverMsg]);
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[80vh]">
      <ChatList chats={chats} activeChat={activeChat} onSelect={openChat} query={query} setQuery={handleSearch} role="Staff" />
      <div className="col-span-2 flex flex-col">
        <ChatWindow activeChat={activeChat} messages={messages} user={user} />
        {activeChat && <ChatInput onSend={handleSend} placeholder="Message a client or staff..." />}
      </div>
    </div>
  );
}
