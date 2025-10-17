// src/components/chat/ChatInput.jsx
import React, { useState } from "react";
import { Send } from "lucide-react";

export default function ChatInput({ onSend, placeholder = "Type a message..." }) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!content.trim() || sending) return;

    setError(null);
    setSending(true);

    try {
      // Expect parent to handle chatId and recipientId internally
      await onSend(content.trim());
      setContent("");
    } catch (err) {
      console.error("Send message failed:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col border-t border-gray-200 bg-white rounded-b-xl">
      <div className="flex items-center gap-2 p-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={sending}
          rows={1}
          className="flex-1 resize-none border border-gray-200 rounded-full px-3 py-2 text-sm 
          focus:ring-2 focus:ring-blue-800 focus:border-blue-800 outline-none scrollbar-thin scrollbar-thumb-gray-300 
          shadow-sm disabled:opacity-50"
        />

        <button
          onClick={handleSend}
          className="bg-blue-800 text-white rounded-full p-3 shadow hover:bg-blue-900 
          disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <Send size={18} />
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-xs px-4 pb-2">{error}</p>
      )}
    </div>
  );
}
