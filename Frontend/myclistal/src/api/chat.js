// src/api/chat.js
import API from "./api";

// Note: backend routes are mounted under /chat
export const getChats = () => API.get("/chat/getchats");
export const getOrCreatePrivateChat = (targetUserId) =>
  API.post("/chat/privatemsg", { targetUserId });

export const getMessages = (chatId, page = 1, limit = 50) =>
  API.get(`/chat/${chatId}/getmessages?page=${page}&limit=${limit}`);

export const sendMessage = (chatId, content, recipientId = null) =>
  API.post(`/chat/${chatId}/sendmessages`, { content, recipientId });

export const markMessagesRead = (chatId) =>
  API.post(`/chat/${chatId}/mark-read`);

export const searchChats = (q) =>
  API.get(`/chat/search?q=${encodeURIComponent(q)}`);
